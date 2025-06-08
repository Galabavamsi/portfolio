// Three.js Scene Setup
        let scene, camera, renderer, controls;
        let armModel, mixer;
        let clock = new THREE.Clock();
        
        // Joints for the robotic arm
        const joints = {
            base: null,
            shoulder: null,
            elbow: null,
            wristPitch: null,
            wristRoll: null,
            gripperLeft: null,
            gripperRight: null
        };
          // Loading screen
        const loadingScreen = document.querySelector('.loading-screen');
        const loadingContent = document.querySelector('.loading-content'); 
        const percentageCounter = document.getElementById('percentage-counter');
        const animatedCommandContainer = document.getElementById('animated-command-container');
        const animatedCommandText = document.getElementById('animated-command-text');
        const matrixCanvas = document.getElementById('matrix-canvas');        const matrixEntryText = document.getElementById('matrix-entry-text');
        let matrixAnimationId;
          // Matrix audio
        let matrixAudio = null;
        
        // Main theme audio
        let mainThemeAudio = null;
        let isMuted = false;

        // Cube and interaction variables
        let pickupCube = null;
        let isCubePickedUp = false;
        const initialCubePosition = new THREE.Vector3(3, -1.8, 2); // Y so it sits on grid (y=-2) + half cube height (0.2)
        const dropOffPosition = new THREE.Vector3(-3, -1.8, 2);

        // Animation variables
        let currentAnimation = null;
        let animationTime = 0;

        const animations = {
            wave: {
                duration: 2, // seconds
                loop: true,
                joints: {
                    shoulder: [ { time: 0, value: 45 }, { time: 1, value: 75 }, { time: 2, value: 45 } ],
                    elbow:    [ { time: 0, value: 90 }, { time: 0.5, value: 60 }, { time: 1.5, value: 120 }, { time: 2, value: 90 } ],
                    wristRoll:[ { time: 0, value: 0 },  { time: 0.5, value: -30 }, { time: 1.5, value: 30 }, { time: 2, value: 0 } ]
                }
            },
            inspect: { 
                duration: 8,
                loop: true,
                joints: {
                    base:       [ {time: 0, value: 0}, {time: 2, value: -60}, {time: 4, value: 0}, {time: 6, value: 60}, {time: 8, value: 0} ],
                    shoulder:   [ {time: 0, value: 45}, {time: 4, value: 30}, {time: 8, value: 45}],
                    wristPitch: [ {time: 0, value: 0}, {time: 2, value: 45}, {time: 4, value: 0}, {time: 6, value: -45}, {time: 8, value: 0} ],
                    wristRoll:  [ {time: 0, value: 0}, {time: 1, value: 30}, {time: 3, value: -30}, {time: 5, value: 30}, {time: 7, value: -30}, {time: 8, value: 0}]
                }
            },
            pickupAndPlace: {
                name: 'pickupAndPlace',
                duration: 12, // seconds
                loop: false,
                pickupTime: 4.5, // Time when gripper is closed and cube should be attached
                releaseTime: 8.5, // Time when gripper is open and cube should be detached
                joints: {
                    base: [
                        { time: 0, value: 0 },    // Initial
                        { time: 2, value: 0 },    // Transitioning towards pickup area
                        { time: 4, value: 146 },  // Arrive at pickup base orientation
                        { time: 4.5, value: 146 },// AT PICKUP: Base 146°
                        { time: 5.0, value: 146 },// Hold base during lift
                        // Travel to place:
                        { time: 7.0, value: 0 },  // Transition base to place orientation (0°)
                        { time: 8.5, value: 0 },  // AT PLACE: Base 0°
                        { time: 12, value: 0 }    // Return to initial
                    ],
                    shoulder: [
                        { time: 0, value: 45 },   // Initial
                        { time: 2, value: 20 },   // Transitioning
                        { time: 4, value: 47 },   // Arrive at pickup shoulder angle
                        { time: 4.5, value: 47 }, // AT PICKUP: Shoulder 47°
                        { time: 5.0, value: 47 }, // Hold during gripper close
                        { time: 5.5, value: 0 },  // Lift cube (to a neutral/safe shoulder angle)
                        { time: 7.0, value: 25 }, // Mid-travel shoulder for place
                        { time: 8.5, value: 49 }, // AT PLACE: Shoulder 49°
                        { time: 9.0, value: 0 },  // Lift arm after release
                        { time: 12, value: 45 }   // Return to initial
                    ],
                    elbow: [
                        { time: 0, value: 90 },   // Initial
                        { time: 2, value: 90 },   // Transitioning
                        { time: 4, value: 116 },  // Arrive at pickup elbow angle
                        { time: 4.5, value: 116 },// AT PICKUP: Elbow 116°
                        { time: 5.0, value: 116 },// Hold during gripper close
                        { time: 5.5, value: 80 }, // Retract/lift elbow
                        { time: 7.0, value: 100}, // Mid-travel elbow for place
                        { time: 8.5, value: 119}, // AT PLACE: Elbow 119°
                        { time: 9.0, value: 80 }, // Retract after release
                        { time: 12, value: 90 }   // Return to initial
                    ],
                    wristPitch: [
                        { time: 0, value: 0 },    // Initial
                        { time: 1.5, value: 40},  // Start pitching
                        { time: 4, value: 80 },   // Arrive at pickup wrist pitch
                        { time: 4.5, value: 80 }, // AT PICKUP: Wrist Pitch 80°
                        { time: 5.0, value: 80 }, // Hold pitch
                        { time: 7.0, value: -12}, // Mid-travel wrist pitch for place
                        { time: 8.5, value: 61 }, // AT PLACE: Wrist Pitch 61°
                        { time: 9.5, value: 0 },  // Pitch back to neutral
                        { time: 12, value: 0 }    // Return to initial
                    ],
                    wristRoll: [
                        { time: 0, value: 0 },    // Initial
                        { time: 2, value: 0 },
                        { time: 4, value: 73 },   // Arrive at pickup wrist roll
                        { time: 4.5, value: 73 }, // AT PICKUP: Wrist Roll 73°
                        { time: 5.0, value: 73 }, // Hold roll
                        { time: 7.0, value: -88}, // Mid-travel wrist roll for place
                        { time: 8.5, value: -95}, // AT PLACE: Wrist Roll -95°
                        { time: 9.5, value: 0 },  // Roll back to neutral
                        { time: 12, value: 0 }    // Return to initial
                    ],
                    gripper: [
                        { time: 0, value: 80 },    // Start open
                        { time: 4, value: 80 },    // Arrive open at pickup location
                        { time: 4.5, value: 50 },  // AT PICKUP: Close gripper to 50%
                        { time: 8.4, value: 50 },  // Hold 50% until just before release
                        { time: 8.5, value: 80 },  // AT PLACE: Open gripper to 80% (releaseTime)
                        { time: 12, value: 50 }    // Reset to default (user's pickup gripper value)
                    ]
                }
            }
        };

        function mapJointToSliderId(jointName) {
            const mapping = {
                base: 'base-rotation',
                shoulder: 'shoulder',
                elbow: 'elbow',
                wristPitch: 'wrist-pitch',
                wristRoll: 'wrist-roll',
                gripper: 'gripper'
            };
            return mapping[jointName];
        }

        function interpolateKeyframes(keyframes, currentTime) {
            if (!keyframes || keyframes.length === 0) return 0;
            if (keyframes.length === 1) return keyframes[0].value;

            if (currentTime <= keyframes[0].time) {
                return keyframes[0].value;
            }
            if (currentTime >= keyframes[keyframes.length - 1].time) {
                return keyframes[keyframes.length - 1].value;
            }

            let p0, p1;
            for (let i = 0; i < keyframes.length - 1; i++) {
                if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
                    p0 = keyframes[i];
                    p1 = keyframes[i + 1];
                    break;
                }
            }

            if (!p0 || !p1) return keyframes[keyframes.length - 1].value; 

            const t = (currentTime - p0.time) / (p1.time - p0.time);
            if (isNaN(t) || !isFinite(t) || (p1.time - p0.time === 0)) return p0.value;

            return p0.value + (p1.value - p0.value) * t;
        }
        
        function initThree() {
            // Create scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000); // Black background
            scene.fog = new THREE.Fog(0x000000, 20, 100); // Darker fog for Matrix theme
            
            // Create camera
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 2, 8);
            
            // Create renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.outputEncoding = THREE.sRGBEncoding;
            document.getElementById('three-container').appendChild(renderer.domElement);
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0x002200, 0.8); // Dark green ambient light
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0x00FF00, 1.0); // Green directional light
            directionalLight.position.set(5, 10, 7);
            directionalLight.castShadow = true;
            scene.add(directionalLight);
            
            const backLight = new THREE.DirectionalLight(0x00AA00, 0.7); // Another shade of green for backlight
            backLight.position.set(-5, -5, -5);
            scene.add(backLight);
            
            // Add orbit controls
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 3;
            controls.maxDistance = 15;
            controls.enablePan = true;
            
            // Create a simple floor grid
            const gridHelper = new THREE.GridHelper(20, 20, 0x00ff00, 0x005500); // Green grid lines, darker secondary lines
            gridHelper.position.y = -2;
            scene.add(gridHelper);
            
            // Create the pickup cube
            const cubeGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4); // Cube dimensions
            const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x003300 }); // Bright green, slight emissive green
            pickupCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            pickupCube.position.copy(initialCubePosition);
            scene.add(pickupCube);

            // Load the robotic arm model
            const loader = new THREE.GLTFLoader();
            
            // For demo purposes, we'll create a placeholder arm since we don't have an actual GLB file
            createPlaceholderArm();
            
            // In a real scenario, you would load your GLB model:
            /*
            loader.load('/models/robotic-arm.glb', (gltf) => {
                armModel = gltf.scene;
                armModel.scale.set(0.8, 0.8, 0.8);
                armModel.position.y = -1.5;
                
                // Traverse the model to find joints
                armModel.traverse((child) => {
                    if (child.isBone) {
                        if (child.name.includes('base')) joints.base = child;
                        if (child.name.includes('shoulder')) joints.shoulder = child;
                        if (child.name.includes('elbow')) joints.elbow = child;
                        if (child.name.includes('wrist_pitch')) joints.wristPitch = child;
                        if (child.name.includes('wrist_roll')) joints.wristRoll = child;
                        if (child.name.includes('gripper_left')) joints.gripperLeft = child;
                        if (child.name.includes('gripper_right')) joints.gripperRight = child;
                    }
                });
                
                scene.add(armModel);
                
                // Animation mixer
                mixer = new THREE.AnimationMixer(armModel);
                
                // Hide loading screen
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 1500);
            }, undefined, (error) => {
                console.error('Error loading model:', error);
                // Hide loading screen even if error occurs
                loadingScreen.style.display = 'none';
            });
            */
            
            // Handle window resize
            window.addEventListener('resize', onWindowResize);
            
            // Start animation loop
            animate();
        }
        
        function createPlaceholderArm() {
            // Base
            const baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 32);
            const baseMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x004d00, // Dark Green
                metalness: 0.6,
                roughness: 0.4
            });
            const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial); 
            baseMesh.position.y = -1.5;
            scene.add(baseMesh);
            joints.base = baseMesh; 
            
            // Shoulder
            const shoulderGroup = new THREE.Group();
            shoulderGroup.position.y = 0.2; 
            baseMesh.add(shoulderGroup); 
            
            const shoulderGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
            const shoulderMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x007f00, // Medium Green
                metalness: 0.5,
                roughness: 0.3
            });
            const shoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
            shoulder.position.y = 0.6;
            shoulderGroup.add(shoulder);
            joints.shoulder = shoulderGroup;
            
            // Upper arm
            const upperArmGroup = new THREE.Group();
            upperArmGroup.position.y = 1.2;
            shoulderGroup.add(upperArmGroup);
            
            const upperArmGeometry = new THREE.BoxGeometry(0.6, 2, 0.6);
            const upperArm = new THREE.Mesh(upperArmGeometry, shoulderMaterial); // Uses shoulderMaterial (Medium Green)
            upperArm.position.y = 1;
            upperArmGroup.add(upperArm);
            joints.elbow = upperArmGroup;
            
            // Lower arm
            const lowerArmGroup = new THREE.Group();
            lowerArmGroup.position.y = 2;
            upperArmGroup.add(lowerArmGroup);
            
            const lowerArmGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
            const lowerArm = new THREE.Mesh(lowerArmGeometry, shoulderMaterial); // Uses shoulderMaterial (Medium Green)
            lowerArm.position.y = 0.9;
            lowerArmGroup.add(lowerArm);
            joints.wristPitch = lowerArmGroup;
            
            // Wrist
            const wristGroup = new THREE.Group();
            wristGroup.position.y = 1.8;
            lowerArmGroup.add(wristGroup);
            
            const wristGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.6);
            const wrist = new THREE.Mesh(wristGeometry, new THREE.MeshStandardMaterial({ 
                color: 0x20C20E, // Vibrant Green
                metalness: 0.7,
                roughness: 0.2
            }));
            wristGroup.add(wrist);
            joints.wristRoll = wristGroup;
            
            // Gripper left
            const gripperLeftGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.4);
            const gripperMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00FF00, // Brightest Green (like grid)
                metalness: 0.8,
                roughness: 0.1,
                emissive: 0x003300 // Slight emissive quality
            });
            const gripperLeft = new THREE.Mesh(gripperLeftGeometry, gripperMaterial);
            gripperLeft.position.set(-0.3, -0.4, 0);
            wristGroup.add(gripperLeft);
            joints.gripperLeft = gripperLeft;
            
            // Gripper right
            const gripperRightGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.4);
            const gripperRight = new THREE.Mesh(gripperRightGeometry, gripperMaterial); // Use the same material
            gripperRight.position.set(0.3, -0.4, 0);
            wristGroup.add(gripperRight);
            joints.gripperRight = gripperRight;
        }
        
        function updateArmJoints() {
            // Update base rotation
            if (joints.base) {
                joints.base.rotation.y = THREE.MathUtils.degToRad(document.getElementById('base-rotation').value);
            }
            
            // Update shoulder
            if (joints.shoulder) {
                joints.shoulder.rotation.z = THREE.MathUtils.degToRad(document.getElementById('shoulder').value);
            }
            
            // Update elbow
            if (joints.elbow) {
                joints.elbow.rotation.z = THREE.MathUtils.degToRad(document.getElementById('elbow').value - 90);
            }
            
            // Update wrist pitch
            if (joints.wristPitch) {
                joints.wristPitch.rotation.z = THREE.MathUtils.degToRad(document.getElementById('wrist-pitch').value);
            }
            
            // Update wrist roll
            if (joints.wristRoll) {
                joints.wristRoll.rotation.y = THREE.MathUtils.degToRad(document.getElementById('wrist-roll').value);
            }
            
            // Update gripper
            if (joints.gripperLeft && joints.gripperRight) {
                const gripperValue = document.getElementById('gripper').value / 100;
                const gripperOffset = 0.3 * (1 - gripperValue);
                joints.gripperLeft.position.x = -0.3 - gripperOffset;
                joints.gripperRight.position.x = 0.3 + gripperOffset;
            }
        }
        
        function applyPreset(preset) {
            const baseSlider = document.getElementById('base-rotation');
            const shoulderSlider = document.getElementById('shoulder');
            const elbowSlider = document.getElementById('elbow');
            const wristPitchSlider = document.getElementById('wrist-pitch');
            const wristRollSlider = document.getElementById('wrist-roll');
            const gripperSlider = document.getElementById('gripper');
            
            // Always reset cube to its initial position when a preset is applied or arm is reset
            if (pickupCube) {
                if (isCubePickedUp) {
                    scene.attach(pickupCube); // Ensure it's parented to scene before moving
                    isCubePickedUp = false;
                }
                pickupCube.position.copy(initialCubePosition);
            }

            if (preset === 'reset') {
                currentAnimation = null; // Stop any ongoing animation
                animationTime = 0;
                baseSlider.value = 0;
                shoulderSlider.value = 45;
                elbowSlider.value = 90;
                wristPitchSlider.value = 0;
                wristRollSlider.value = 0;
                gripperSlider.value = 50;
                
                // Update display values
                document.getElementById('base-rotation-value').textContent = baseSlider.value + '°';
                document.getElementById('shoulder-value').textContent = shoulderSlider.value + '°';
                document.getElementById('elbow-value').textContent = elbowSlider.value + '°';
                document.getElementById('wrist-pitch-value').textContent = wristPitchSlider.value + '°';
                document.getElementById('wrist-roll-value').textContent = wristRollSlider.value + '°';
                document.getElementById('gripper-value').textContent = gripperSlider.value + '%';
                
                updateArmJoints(); // Apply static reset pose
                return;
            }

            const animationData = animations[preset];
            if (animationData) {
                currentAnimation = animationData;
                animationTime = 0;
                // Sliders and joints will be updated by the animate() function
            } else {
                console.warn(`Animation for preset "${preset}" not found.`);
                // Optionally, stop current animation if a preset button without animation is clicked
                // currentAnimation = null; 
            }
        }
        
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        function animate() {
            requestAnimationFrame(animate);
            
            const delta = clock.getDelta();

            if (currentAnimation) {
                animationTime += delta;
                const duration = currentAnimation.duration;
                let animationEnded = false;

                if (animationTime >= duration) {
                    if (currentAnimation.loop) {
                        animationTime %= duration; // Loop animation
                    } else {
                        animationTime = duration; // Clamp to end
                        animationEnded = true;
                    }
                }

                for (const jointName in currentAnimation.joints) {
                    const keyframes = currentAnimation.joints[jointName];
                    const currentValue = interpolateKeyframes(keyframes, animationTime);
                    const jointObject = joints[jointName];

                    if (jointObject) {
                        if (jointName === 'base') {
                            jointObject.rotation.y = THREE.MathUtils.degToRad(currentValue);
                        } else if (jointName === 'shoulder') {
                            jointObject.rotation.z = THREE.MathUtils.degToRad(currentValue);
                        } else if (jointName === 'elbow') {
                            jointObject.rotation.z = THREE.MathUtils.degToRad(currentValue - 90);
                        } else if (jointName === 'wristPitch') {
                            jointObject.rotation.z = THREE.MathUtils.degToRad(currentValue);
                        } else if (jointName === 'wristRoll') {
                            jointObject.rotation.y = THREE.MathUtils.degToRad(currentValue);
                        } else if (jointName === 'gripper') {
                            const gripperOffset = 0.3 * (1 - (currentValue / 100));
                            if (joints.gripperLeft && joints.gripperRight) {
                                joints.gripperLeft.position.x = -0.3 - gripperOffset;
                                joints.gripperRight.position.x = 0.3 + gripperOffset;
                            }
                        }
                    }

                    const sliderId = mapJointToSliderId(jointName);
                    const slider = document.getElementById(sliderId);
                    if (slider) {
                        slider.value = currentValue;
                        const valueDisplay = document.getElementById(slider.id + '-value');
                        if (valueDisplay) {
                            valueDisplay.textContent = slider.id === 'gripper' ? currentValue.toFixed(0) + '%' : currentValue.toFixed(0) + '°';
                        }
                    }
                }

                // Cube interaction logic specifically for pickupAndPlace
                if (currentAnimation.name === 'pickupAndPlace' && pickupCube) {
                    const time = animationTime;
                    const pickupEventTime = currentAnimation.pickupTime;
                    const releaseEventTime = currentAnimation.releaseTime;

                    // Check if it's time to pick up
                    if (time >= pickupEventTime && time < releaseEventTime && !isCubePickedUp) {
                        joints.wristRoll.attach(pickupCube); // Attach to gripper (wristRoll group)
                        pickupCube.position.set(0, -0.45, 0.15); // Position relative to wristRoll center
                        isCubePickedUp = true;
                    }
                    // Check if it's time to release
                    else if (time >= releaseEventTime && isCubePickedUp) {
                        scene.attach(pickupCube); // Detach from gripper, attach to scene
                        pickupCube.position.copy(dropOffPosition);
                        isCubePickedUp = false;
                    }
                }


                if (animationEnded && !currentAnimation.loop) {
                    currentAnimation = null; // Stop animation
                }
            }
            
            // Update animation mixer if we have one
            if (mixer) mixer.update(delta);
            
            controls.update();
            renderer.render(scene, camera);
        }
        
        // Loading screen sequence
        function startLoadingSequence() {
            document.body.classList.add('loading'); 
            
            // Hide percentage counter elements
            if (percentageCounter) percentageCounter.style.display = 'none';
            if (loadingContent) loadingContent.style.display = 'none';
            
            // Get command container elements without creating additional global variables
            const cmdContainer = document.getElementById('animated-command-container');
            const cmdText = document.getElementById('animated-command-text');
            
            if (!cmdContainer || !cmdText) {
                console.error('Command animation elements not found');
                // Fallback to immediately show main content
                if (loadingScreen) loadingScreen.style.display = 'none';
                document.body.classList.remove('loading');
                return;
            }
              // Show command container
            cmdContainer.style.display = 'block';
              // Command to type
            const command = '[user@matrix ~]$ connect --construct=Portfolio \n Compiling Binaries ..... done \n Installing dependencies ..... done \n Building Workspace ..... done \n Loading';
            
            // Use the existing typeWriter function to type the command
            typeWriter(cmdText, command, 50, () => {
                // After command is typed, start spinner animation
                const spinnerChars = ['|', '/', '-', '\\'];
                let spinnerIndex = 0;
                let dotCount = 0;
                const maxDots = 6;
                  const spinnerInterval = setInterval(() => {
                    // Update spinner character and dots with enhanced styling
                    const spinner = `<span class="terminal-spinner">${spinnerChars[spinnerIndex]}</span>`;
                    const dots = `<span class="terminal-dots">${'.'.repeat((dotCount % (maxDots + 1)))}</span>`;
                    cmdText.innerHTML = command + ' ' + spinner + ' ' + dots;
                    
                    spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
                    dotCount++;
                }, 150); // Change spinner every 150ms
                
                // Stop spinner after 2 seconds and continue with matrix animation
                setTimeout(() => {
                    clearInterval(spinnerInterval);
                    cmdText.innerHTML = command + ' <span class="terminal-success">✓ done</span>';
                    
                    // Wait a moment before transitioning to matrix
                    setTimeout(() => {
                    // Hide command and show matrix animation
                    cmdContainer.style.display = 'none';
                    matrixCanvas.style.display = 'block';
                    matrixEntryText.style.display = 'block';
                    
                    // Timeout to ensure display:block is applied before opacity transition
                    setTimeout(() => {
                        matrixEntryText.style.opacity = '1';
                    }, 50);
                      // Start the matrix animation
                    initMatrixAnimation();
                    
                    // Start matrix audio
                    try {
                        matrixAudio = new Audio('resources/matrixaudio.mp3');
                        matrixAudio.volume = 0.7; // Set volume to 70%
                        matrixAudio.play().catch(error => {
                            console.warn('Matrix audio playback failed:', error);
                        });
                    } catch (error) {
                        console.warn('Matrix audio initialization failed:', error);
                    }
                    
                    const matrixDisplayDuration = 3000; // How long matrix + text are shown (shortened from 5000)
                    const textFadeOutDuration = 800;    // Must match #matrix-entry-text transition
                    const screenFadeOutDuration = 2000; // Must match .loading-screen transition (shortened from 1500)
                    
                    // After matrixDisplayDuration, start fading out the text
                    setTimeout(() => {
                        matrixEntryText.style.opacity = '0'; // Start fading out text
                          setTimeout(() => {
                            matrixEntryText.style.display = 'none';
                            loadingScreen.style.opacity = '0'; // Start fading out whole screen
                            
                            setTimeout(() => {
                                loadingScreen.style.display = 'none';
                                document.body.classList.remove('loading');
                                if (matrixAnimationId) cancelAnimationFrame(matrixAnimationId); // Stop matrix animation
                                
                                // Stop matrix audio
                                if (matrixAudio) {
                                    matrixAudio.pause();
                                    matrixAudio.currentTime = 0;
                                    matrixAudio = null;
                                }
                                
                                // Start main theme audio
                                startMainThemeAudio();
                            }, screenFadeOutDuration);
                        }, textFadeOutDuration);
                    }, matrixDisplayDuration - textFadeOutDuration); // Start text fade out earlier
                    }, 800); // Pause after command typing is done
                }, 2000); // Stop spinner after 2 seconds
            });
        }

        function initMatrixAnimation() {
            const ctx = matrixCanvas.getContext('2d');
            matrixCanvas.width = window.innerWidth;
            matrixCanvas.height = window.innerHeight;

            const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
            const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const nums = '0123456789';
            const characters = katakana + latin + nums;

            const fontSize = 16;
            const columns = Math.floor(matrixCanvas.width / fontSize);
            const drops = [];
            for (let x = 0; x < columns; x++) {
                drops[x] = 1;
            }

            function drawMatrix() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Semi-transparent black for fading effect
                ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

                ctx.fillStyle = '#0F0'; // Green text
                ctx.font = fontSize + 'px monospace';

                for (let i = 0; i < drops.length; i++) {
                    const text = characters.charAt(Math.floor(Math.random() * characters.length));
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                    if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                        drops[i] = 0; // Reset drop to top
                    }
                    drops[i]++;
                }
                matrixAnimationId = requestAnimationFrame(drawMatrix);
            }
            drawMatrix();
            
            window.addEventListener('resize', () => { // Adjust canvas on resize during matrix
                if (matrixCanvas.style.display === 'block') {                    matrixCanvas.width = window.innerWidth;
                    matrixCanvas.height = window.innerHeight;
                    // Recalculate columns if needed, or simply let it adjust
                    // For simplicity, not re-initializing drops here, might cause visual jump on resize
                }
            });
        }

        // Main theme audio functions
        function startMainThemeAudio() {
            try {
                mainThemeAudio = new Audio('resources/maintheme.mp3');
                mainThemeAudio.loop = true; // Loop the background music
                mainThemeAudio.volume = 0.3; // Set volume to 30% for background music
                
                if (!isMuted) {
                    mainThemeAudio.play().catch(error => {
                        console.warn('Main theme audio playback failed:', error);
                    });
                }
                
                // Create and show the mute button
                createMuteButton();
            } catch (error) {
                console.warn('Main theme audio initialization failed:', error);
            }
        }

        function createMuteButton() {
            // Check if button already exists
            if (document.getElementById('mute-button')) return;
            
            const muteButton = document.createElement('button');
            muteButton.id = 'mute-button';
            muteButton.className = 'retro-mute-button';
            muteButton.innerHTML = isMuted ? '🔇' : '🔊';
            muteButton.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
            
            muteButton.addEventListener('click', toggleMute);
            
            // Add button to page
            document.body.appendChild(muteButton);
        }

        function toggleMute() {
            isMuted = !isMuted;
            const muteButton = document.getElementById('mute-button');
            
            if (mainThemeAudio) {
                if (isMuted) {
                    mainThemeAudio.pause();
                    muteButton.innerHTML = '🔇';
                    muteButton.setAttribute('aria-label', 'Unmute audio');
                } else {
                    mainThemeAudio.play().catch(error => {
                        console.warn('Main theme audio playback failed:', error);
                    });
                    muteButton.innerHTML = '🔊';
                    muteButton.setAttribute('aria-label', 'Mute audio');
                }
            }
        }


        // Initialize Three.js when page loads
        window.addEventListener('load', () => {
            initThree(); 
            startLoadingSequence(); 

            // Setup event listeners for sliders
            const sliders = document.querySelectorAll('input[type="range"]');
            sliders.forEach(slider => {
                slider.addEventListener('input', () => {
                    // If user manually controls, and cube was picked up, reset it.
                    if (isCubePickedUp && pickupCube) {
                        scene.attach(pickupCube);
                        pickupCube.position.copy(initialCubePosition);
                        isCubePickedUp = false;
                    }
                    currentAnimation = null; // Stop animation on manual control
                    animationTime = 0;

                    const valueDisplay = document.getElementById(slider.id + '-value');
                    if (valueDisplay) { // Check if valueDisplay exists
                        if (slider.id === 'gripper') {
                            valueDisplay.textContent = slider.value + '%';
                        } else {
                            valueDisplay.textContent = slider.value + '°';
                        }
                    }
                    updateArmJoints();
                });
            });
            
            // Setup event listeners for preset buttons
            const presetButtons = document.querySelectorAll('.preset-btn');
            presetButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const preset = button.getAttribute('data-preset');
                    applyPreset(preset);
                });
            });
        });

        // Intersection Observer for section animations
        const sections = document.querySelectorAll('section[id]');
        const observerOptions = {
            root: null, // relative to document viewport
            rootMargin: '0px',
            threshold: 0.1 // 10% of the section is visible
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');

                    // Check if the intersecting section is 'about' and if animation hasn't run
                    if (entry.target.id === 'about' && !entry.target.dataset.aboutAnimated) {

                        entry.target.dataset.aboutAnimated = 'true'; // Set flag to true using a data attribute

                        // Initialize typing effects for the about section
                        const line1 = document.getElementById('profile-line-1');
                        const line2 = document.getElementById('profile-line-2');
                        const line3 = document.getElementById('profile-line-3');
                        const line4 = document.getElementById('profile-line-4');
                        const line5 = document.getElementById('profile-line-5');
                        const contactPrompt = document.getElementById('contact-prompt');

                        // Clear any existing animation comments that might set opacity to 0
                        [line1, line2, line3, line4, line5, contactPrompt].forEach(el => {
                            // el.style.opacity = '1'; // Ensure visible before typing, handled by typeWriter now
                        });                        // Start typing with delays and proper chaining (disable audio for About section)
                        if (line1) typeWriter(line1, line1.textContent, 50, () => {
                            if (line2) typeWriter(line2, line2.textContent, 50, () => {
                                if (line3) typeWriter(line3, line3.textContent, 50, () => {
                                    if (line4) typeWriter(line4, line4.textContent, 50, () => {
                                        if (line5) typeWriter(line5, line5.textContent, 50, () => {
                                            if (contactPrompt) typeWriter(contactPrompt, contactPrompt.textContent, 50, null, false);
                                        }, false);
                                    }, false);
                                }, false);
                            }, false);
                        }, false);
                    }
                } else {
                    // Remove class if you want animation to re-trigger on scroll up/out
                    entry.target.classList.remove('is-visible');
                    // If you want the 'about' typing to re-trigger if it scrolls out and back in,
                    // you could remove the data attribute here:
                    // if (entry.target.id === 'about') {
                    //     delete entry.target.dataset.aboutAnimated;
                    // }
                }
            });
        };

        // Ensure this new observer is used
        const newSectionObserver = new IntersectionObserver(observerCallback, observerOptions);
        
        sections.forEach(section => {
            if (!section.classList.contains('no-fade')) { // Check for no-fade class
                section.classList.add('fade-in-section');
            }
            newSectionObserver.observe(section);
        });        function typeWriter(element, text, delay = 50, callback, enableAudio = true) {
            element.innerHTML = ''; // Clear existing content
            let i = 0;
            element.style.opacity = '1'; // Make sure it's visible before typing
            element.style.borderRight = '.15em solid #00FF00'; // Start with caret
            
            // Audio context for typing sounds
            let audioContext;
            let oscillator;
            
            function createTypingSound() {
                try {
                    if (!audioContext) {
                        audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    }
                    
                    oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    // Random frequency for old terminal sound
                    oscillator.frequency.value = 800 + Math.random() * 400;
                    oscillator.type = 'square';
                    
                    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                } catch (e) {
                    // Audio might not be supported, continue silently
                }
            }
              function typing() {
                if (i < text.length) {
                    const char = text.charAt(i);
                    element.innerHTML += char;
                    
                    // Create typing sound for each character (only if audio is enabled)
                    if (enableAudio) {
                        createTypingSound();
                    }
                    
                    // Variable delay for realistic typing
                    let currentDelay = delay;
                    
                    // Add variance to typing speed
                    currentDelay += Math.random() * 30 - 15;
                    
                    // Longer pauses after punctuation
                    if (char === '.' || char === '!' || char === '?') {
                        currentDelay += 200;
                    } else if (char === ',' || char === ';') {
                        currentDelay += 100;
                    } else if (char === ' ') {
                        currentDelay += 20;
                    }
                    
                    // Ensure minimum delay
                    currentDelay = Math.max(currentDelay, 20);
                    
                    i++;
                    setTimeout(typing, currentDelay);
                } else {
                    element.style.borderRightColor = 'transparent'; // Remove caret after typing
                    element.classList.add('finished-typing-cursor');
                    if (callback) callback(); // Execute callback if provided
                }
            }
            typing();
        }

        function showTab(tabId, clickedButton) {
            // Hide all tab content
            const tabContents = document.querySelectorAll('#about .matrix-tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active-content');
            });

            // Deactivate all tab buttons
            const tabButtons = document.querySelectorAll('#about .matrix-tab-button');
            tabButtons.forEach(button => {
                button.classList.remove('active');
            });

            // Show the selected tab content
            const selectedTabContent = document.getElementById(tabId);
            if (selectedTabContent) {
                selectedTabContent.classList.add('active-content');

                const elementsToAnimateDetails = [];

                // Handle prompt element
                const promptElement = selectedTabContent.querySelector('.matrix-prompt');
                if (promptElement) {
                    if (!promptElement.hasAttribute('data-original-text')) {
                        promptElement.setAttribute('data-original-text', promptElement.textContent);
                    }
                    const textForPrompt = promptElement.getAttribute('data-original-text');
                    if (textForPrompt && textForPrompt.trim() !== "") {
                        elementsToAnimateDetails.push({ 
                            el: promptElement, 
                            text: textForPrompt.trim() 
                        });
                    }
                }

                // Handle list items
                const listItems = selectedTabContent.querySelectorAll('.matrix-list li');
                listItems.forEach(item => {
                    const highlightSpan = item.querySelector('span.matrix-highlight');
                    let textToType = "";
                    let targetElementForTyping;

                    if (highlightSpan) {
                        // Logic to handle elements with a leading static span and trailing dynamic text
                        let typeSpan = item.querySelector('span.typewriter-target');
                        
                        if (!item.hasAttribute('data-original-trailing-text')) {
                            // This block runs once per item to capture and store original trailing text
                            let originalTrailingText = "";
                            let currentNode = highlightSpan.nextSibling;
                            while (currentNode) {
                                if (currentNode.nodeType === Node.TEXT_NODE) {
                                    originalTrailingText += currentNode.textContent;
                                } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                                    // If there are other unexpected elements, capture their text too.
                                    // This might need refinement if structure is very complex.
                                    originalTrailingText += currentNode.textContent; 
                                }
                                currentNode = currentNode.nextSibling;
                            }
                            item.setAttribute('data-original-trailing-text', originalTrailingText.trim());
                        }
                        
                        textToType = item.getAttribute('data-original-trailing-text');

                        // Ensure the typewriter-target span exists and is clean
                        if (!typeSpan) {
                            typeSpan = document.createElement('span');
                            typeSpan.className = 'typewriter-target';
                             // Remove all nodes after highlightSpan before adding the new target span
                            while (highlightSpan.nextSibling) {
                                item.removeChild(highlightSpan.nextSibling);
                            }
                            item.appendChild(typeSpan);
                        } else {
                            typeSpan.innerHTML = ''; // Clear if exists
                        }
                        targetElementForTyping = typeSpan;

                    } else {
                        // No highlight span, type the whole LI content
                        if (!item.hasAttribute('data-original-text')) {
                            item.setAttribute('data-original-text', item.textContent);
                        }
                        textToType = item.getAttribute('data-original-text');
                        targetElementForTyping = item; // Type directly into the LI
                    }
                    
                    if (textToType && textToType.trim() !== "") {
                        elementsToAnimateDetails.push({ 
                            el: targetElementForTyping, 
                            text: textToType.trim()
                        });
                    }
                });
                
                // Prepare all target elements for animation
                elementsToAnimateDetails.forEach(detail => {
                    detail.el.innerHTML = ''; 
                    detail.el.style.opacity = '0'; // typeWriter will set to 1
                    detail.el.classList.remove('finished-typing-cursor');
                    detail.el.style.borderRight = 'none';
                });

                // Chain the typeWriter calls
                let currentElementIndex = 0;
                function animateNextElement() {
                    if (currentElementIndex < elementsToAnimateDetails.length) {
                        const detail = elementsToAnimateDetails[currentElementIndex];
                        currentElementIndex++;                        // Ensure element is part of the DOM and visible
                        if (detail.el && detail.el.isConnected && 
                            (detail.el.offsetParent !== null || getComputedStyle(detail.el).display !== 'none')) {
                           typeWriter(detail.el, detail.text, 20, animateNextElement, false); // Disable audio for About section tab content
                        } else {
                            // Element not visible or not in DOM, skip and proceed
                            animateNextElement();
                        }
                    }
                }
                
                if (elementsToAnimateDetails.length > 0) {
                    animateNextElement();
                }
            }

            // Activate the clicked button
            if (clickedButton) {
                clickedButton.classList.add('active');
            }
        }
    // ================================
    // AI CHATBOT IMPLEMENTATION
    // ================================

    class VamsiBotAI {
        constructor() {            this.knowledgeBase = {
                personal: {
                    name: "Galaba Vamsi",
                    role: "Mechatronics Engineering Student",
                    institution: "IIT Bhilai",
                    location: "Bangalore, Karnataka",
                    email: "galabav@iitbhilai.ac.in",
                    phone: "+91 7483047846",
                    linkedin: "galaba-vamsi-334758211",
                    github: "Galabavamsii",
                    objective: "Enthusiastic Mechatronics undergraduate at IIT Bhilai with strong technical, leadership, and project management skills. Eager to contribute to software development, robotics, and engineering projects, applying a hands-on approach and a passion for making technology accessible and impactful."
                },
                education: {
                    current: "Bachelor of Technology in Mechatronics (2023-2027) at IIT Bhilai",
                    class12: "CBSE Class 12 - 96% (Air Force School Hebbal) with strong focus on Mathematics and Computer Science",
                    class10: "CBSE Class 10 - 94.4% with distinction in STEM subjects (Air Force School Yelahanka)",
                    relevantCourses: [
                        "Data Structures and Algorithms",
                        "Machine Learning",
                        "Robotics Systems",
                        "C++",
                        "Python Programming",
                        "ROS2",
                        "Linear Algebra",
                        "Probability and Statistics"
                    ]
                },                skills: {
                    programming: ["Python", "C", "C++", "JavaScript", "Dart"],
                    webDev: ["React.js", "Node.js", "Three.js", "Tailwind CSS", "Flask", "Bootstrap"],
                    appDev: ["Flutter"],
                    robotics: ["ROS2", "NVIDIA Isaac", "Drone Development", "Navigation Systems", "MuJoCo"],
                    ml: ["Machine Learning", "Deep Learning", "Computer Vision", "TensorFlow", "Data Structures & Algorithms"],
                    dataAnalysis: ["Numpy", "Pandas"],
                    cad: ["SolidWorks", "AutoCAD"],
                    simulation: ["MuJoCo", "NVIDIA Isaac Sim", "Unreal Engine"],
                    other: ["UI/UX (Figma, Adobe XD)", "Blender"]
                },
                projects: [
                    {
                        name: "RIS Simulator",
                        period: "2025 – Present",
                        organization: "IIT Bhilai",
                        description: "Developed a GUI-based Reconfigurable Intelligent Surface (RIS) simulator for advanced testing and coverage analysis, integrating Python, Go, and Qt/C++. Contributed to RIS fabrication support and performance evaluation."
                    },
                    {
                        name: "Shared Action Autonomous Smart Wheelchair",
                        period: "2025 – Present",
                        organization: "IIT Bhilai",
                        description: "Led development of a smart wheelchair integrating EEG/EMG, joystick, and voice controls for enhanced accessibility. Applied deep learning techniques for signal processing and control integration. Utilized NVIDIA Isaac Sim and MuJoCo for simulation and testing."
                    },
                    {
                        name: "Polaris Website",
                        period: "2024",
                        organization: "IIT Bhilai",
                        description: "Designed and deployed IIT Bhilai's official freshers' orientation website, featuring interactive dashboards, event updates, and resource hubs, improving onboarding experience."
                    },
                    {
                        name: "Serenity Mental Health App",
                        period: "Ongoing",
                        organization: "Personal Project",
                        description: "Flutter-based app offering stress analysis, interactive games, journaling, fitness tracking, and meditation tools, aiming to enhance student mental health and well-being."
                    },
                    {
                        name: "Mars Rover Project",
                        period: "2024",
                        organization: "IIT Bhilai - Epsilon Club",
                        description: "Contributed to CAD modeling and navigation systems development for Epsilon Club's Mars Rover project. Integrated ROS2 with NVIDIA Isaac Sim and MuJoCo for simulation and real-time testing."
                    }
                ],
                experience: [
                    {
                        role: "Research Intern",
                        organization: "IIT Bhilai",
                        period: "May 2025 – Present",
                        description: "Working on RIS technologies, developing GUI simulators and supporting hardware fabrication, contributing to research publications and lab automation."
                    },
                    {
                        role: "Secretary, Film and Photography Society",
                        organization: "IIT Bhilai",
                        period: "Apr 2024 – Apr 2025",
                        description: "Elected as FPS Secretary; led initiatives that improved the club's Inter-IIT ranking from 17th to 6th place. Organized workshops, competitions, and inter-IIT participation, significantly enhancing club visibility and performance."
                    },
                    {
                        role: "Student Mentor",
                        organization: "IIT Bhilai",
                        period: "May 2024 – Apr 2025",
                        description: "Guided first-year students academically and socially, promoting a supportive environment. Helped with onboarding and academic resources, ensuring smooth transition to college life."
                    },
                    {
                        role: "Swiggy Campus CEO",
                        organization: "Swiggy",
                        period: "Apr 2024 – Sep 2024",
                        description: "Executed marketing strategies, data-driven consumer engagement, and promotional campaigns to enhance brand presence and adoption on campus."
                    },
                    {
                        role: "Polaris Website Developer",
                        organization: "IIT Bhilai",
                        period: "May 2024 – Jul 2024",
                        description: "Developed and maintained the official orientation website, collaborating with administrative and student teams to ensure real-time information and user-friendly design."
                    }
                ],
                achievements: [
                    "FPS Inter-IIT Ranking: Improved IIT Bhilai's FPS ranking from 17th to 6th place in a single year as Secretary",
                    "Toyota Hackathon: Top 10 placement for Automated Car Safety System prototype",
                    "ATL Hackathon: 2nd Prize for BMTC Ticketing App addressing COVID safety and efficient transport",
                    "Epsilon Club: Contributed to Mars Rover Project's CAD modeling and system integration",
                    "Graphic Design: Shortlisted for regional round of National Skill India Competition",
                    "Badminton: 3rd Prize in Under-19 tournament by Decathlon and Indian Air Force"
                ],
                interests: [
                    "Robotics: Active participant in Epsilon Club, contributing to Mars Rover and warehouse drone projects",
                    "Film & Photography: Produced videos, led club events, and managed social media for FPS",
                    "Reading: Science fiction and popular science books including The Martian, Three-Body Problem series, and Dune",
                    "Gaming & Creative Arts: Skilled in Blender and Unreal Engine for 3D modeling and simulation; enjoys competitive card games and game design"
                ]            };
            
            this.chatHistory = [];
            this.isTyping = false;
            this.initializeChatbot();
        }        initializeChatbot() {
            // Get DOM elements
            this.chatbotContainer = document.getElementById('chatbot-container');
            this.chatbotToggle = document.getElementById('chatbot-toggle');
            this.chatbotClose = document.getElementById('chatbot-close');
            this.chatbotMessages = document.getElementById('chatbot-messages');
            this.chatbotInput = document.getElementById('chatbot-input');
            this.chatbotSend = document.getElementById('chatbot-send');
            this.suggestionButtons = document.querySelectorAll('.suggestion-btn');

            console.log('Chatbot elements found:', {
                container: !!this.chatbotContainer,
                toggle: !!this.chatbotToggle,
                close: !!this.chatbotClose,
                messages: !!this.chatbotMessages,
                input: !!this.chatbotInput,
                send: !!this.chatbotSend,
                suggestionButtons: this.suggestionButtons.length
            });

            // Bind events
            this.bindEvents();
        }bindEvents() {
            // Toggle chatbot
            this.chatbotToggle.addEventListener('click', () => this.toggleChatbot());
            this.chatbotClose.addEventListener('click', () => this.closeChatbot());

            // Send message
            this.chatbotSend.addEventListener('click', () => this.handleUserMessage());
            this.chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleUserMessage();
                }
            });

            // Suggestion buttons
            this.suggestionButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    console.log('Suggestion button clicked:', btn);
                    const question = btn.getAttribute('data-question');
                    console.log('Question:', question);
                    this.simulateUserMessage(question);
                });
            });

            // Auto-resize input
            this.chatbotInput.addEventListener('input', () => {
                this.chatbotInput.style.height = 'auto';
                this.chatbotInput.style.height = this.chatbotInput.scrollHeight + 'px';
            });
        }

        toggleChatbot() {
            if (this.chatbotContainer.classList.contains('chatbot-hidden')) {
                this.openChatbot();
            } else {
                this.closeChatbot();
            }
        }

    openChatbot() {
        this.chatbotContainer.classList.remove('chatbot-hidden');
        this.chatbotInput.focus();
        
        // Update toggle button - hide it when chatbot is open
        this.chatbotToggle.style.display = 'none';
    }

    closeChatbot() {
        this.chatbotContainer.classList.add('chatbot-hidden');
        
        // Show toggle button when chatbot is closed
        this.chatbotToggle.style.display = 'flex';
    }

        handleUserMessage() {
            const message = this.chatbotInput.value.trim();
            if (!message || this.isTyping) return;

            this.addMessage(message, 'user');
            this.chatbotInput.value = '';
            this.chatbotInput.style.height = 'auto';

            // Add typing indicator
            this.showTypingIndicator();

            // Process message and generate response
            setTimeout(() => {
                const response = this.generateResponse(message);
                this.hideTypingIndicator();
                this.addMessage(response, 'bot');
            }, 1000 + Math.random() * 1000); // Simulate thinking time
        }        simulateUserMessage(message) {
            console.log('Simulating user message:', message);
            this.addMessage(message, 'user');
            this.showTypingIndicator();

            setTimeout(() => {
                try {
                    const response = this.generateResponse(message);
                    console.log('Generated response:', response);
                    this.hideTypingIndicator();
                    this.addMessage(response, 'bot');
                } catch (error) {
                    console.error('Error generating response:', error);
                    this.hideTypingIndicator();
                    this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'bot');
                }
            }, 1500); // Increased delay to show the loading spinner better
        }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const prefix = document.createElement('span');
        prefix.className = 'message-prefix';
        prefix.textContent = sender === 'user' ? '[User]:' : '[VamsiBot]:';

        const messageText = document.createElement('span');
        messageText.className = 'message-text';
        
        // Parse markdown-style formatting for bot messages
        if (sender === 'bot') {
            // Convert **text** to <strong>text</strong>
            const formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            messageText.innerHTML = formattedText;
        } else {
            messageText.textContent = text;
        }

        messageDiv.appendChild(prefix);
        messageDiv.appendChild(messageText);

        this.chatbotMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Add to chat history
        this.chatHistory.push({ sender, text, timestamp: new Date() });
    }        showTypingIndicator() {
            this.isTyping = true;
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot-message typing-indicator';
            typingDiv.id = 'typing-indicator';

            const prefix = document.createElement('span');
            prefix.className = 'message-prefix';
            prefix.textContent = '[VamsiBot]:';

            const loadingContent = document.createElement('span');
            loadingContent.className = 'loading-content';
            loadingContent.innerHTML = '<span class="spinner">⟳</span> Fetching...';

            typingDiv.appendChild(prefix);
            typingDiv.appendChild(loadingContent);

            this.chatbotMessages.appendChild(typingDiv);
            this.scrollToBottom();
        }

        hideTypingIndicator() {
            this.isTyping = false;
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }        scrollToBottom() {
            this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight;
        }

        generateResponse(userMessage) {
            const message = userMessage.toLowerCase();
            console.log('VamsiBotAI.generateResponse called with:', message);

            // PRIORITY 1: Hiring questions
            if (this.matchesKeywords(message, ['hire', 'hiring', 'should i hire', 'why hire', 'employment', 'recruit', 'should we hire', 'why should i hire', 'why should we hire', 'employ', 'candidate', 'perfect candidate', 'good choice', 'worth hiring', 'hirable', 'recruitment', 'hire vamsi', 'hire galaba', 'hire him'])) {
                console.log('Hiring keywords matched! Calling formatHiringResponse()');
                const hiringResponse = this.formatHiringResponse();
                console.log('formatHiringResponse() returned:', hiringResponse.substring(0, 100) + '...');
                return hiringResponse;
            }
            // PRIORITY 2: Work readiness
            else if (this.matchesKeywords(message, ['ready for work', 'internship ready', 'job ready', 'employable'])) {
                console.log('Work readiness keywords matched');
                return this.formatWorkReadinessResponse();
            }
            // PRIORITY 3: Strengths and value proposition
            else if (this.matchesKeywords(message, ['strengths', 'value', 'contribution', 'bring to team', 'add value'])) {
                console.log('Strengths keywords matched');
                return this.formatStrengthsResponse();
            }
            // PRIORITY 4: Projects
            else if (this.matchesKeywords(message, ['project', 'work', 'portfolio', 'built', 'created'])) {
                console.log('Project keywords matched');
                return this.formatProjectsResponse();
            }
            // PRIORITY 5: Skills
            else if (this.matchesKeywords(message, ['skill', 'technology', 'programming', 'language', 'tool'])) {
                console.log('Skill keywords matched');
                return this.formatSkillsResponse();
            }
            // PRIORITY 6: Education
            else if (this.matchesKeywords(message, ['education', 'degree', 'university', 'college', 'study'])) {
                console.log('Education keywords matched');
                return this.formatEducationResponse();
            }
            // PRIORITY 7: Experience
            else if (this.matchesKeywords(message, ['experience', 'job', 'internship', 'work experience'])) {
                console.log('Experience keywords matched');
                return this.formatExperienceResponse();
            }
            // PRIORITY 8: Robotics specific
            else if (this.matchesKeywords(message, ['robot', 'robotics', 'automation', 'arm', 'autonomous'])) {
                console.log('Robotics keywords matched');
                return this.formatRoboticsResponse();
            }
            // PRIORITY 9: AI/ML specific
            else if (this.matchesKeywords(message, ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'])) {
                console.log('AI/ML keywords matched');
                return this.formatAIResponse();
            }
            // PRIORITY 10: Personal info
            else if (this.matchesKeywords(message, ['about', 'who', 'vamsi', 'personal', 'background'])) {
                console.log('Personal info keywords matched');
                return this.formatPersonalResponse();
            }
            // PRIORITY 11: Contact
            else if (this.matchesKeywords(message, ['contact', 'email', 'linkedin', 'github', 'social'])) {
                console.log('Contact keywords matched');
                return this.formatContactResponse();
            }
            // PRIORITY 12: Greeting responses
            else if (this.matchesKeywords(message, ['hello', 'hi', 'hey', 'greetings'])) {
                console.log('Greeting keywords matched');
                return this.getRandomResponse([
                    "Hello! I'm VamsiBot, your AI assistant. I can tell you all about Galaba Vamsi's projects, skills, and experience. What would you like to know?",
                    "Hi there! Welcome to Vamsi's portfolio. I'm here to answer any questions about his robotics projects, technical skills, or background.",
                    "Greetings! I'm VamsiBot, ready to help you learn about Vamsi's work in robotics and AI. What interests you most?"
                ]);
            }
            // LAST RESORT: Default response
            else {
                console.log('No specific keywords matched, returning default response.');
                return this.getRandomResponse([
                    "I can help you learn about Vamsi's projects, skills, education, and experience. Try asking about his robotics projects or technical skills!",
                    "I'm here to answer questions about Galaba Vamsi's work in robotics and AI. What specific area interests you?",
                    "Feel free to ask about Vamsi's projects, programming skills, education, or any other aspect of his portfolio!"
                ]);
            }
        }

        matchesKeywords(message, keywords) {
            return keywords.some(keyword => message.includes(keyword));
        }

        getRandomResponse(responses) {
            return responses[Math.floor(Math.random() * responses.length)];
        }        formatProjectsResponse() {
            const projects = this.knowledgeBase.projects;
            let response = "**Vamsi's Projects:**\n\n";
            
            projects.forEach((project, index) => {
                response += `${index + 1}. **${project.name}** (${project.period})\n`;
                response += `   Organization: ${project.organization}\n`;
                response += `   ${project.description}\n\n`;
            });

            response += "Would you like details about any specific project?";
            return response;
        }

        formatSkillsResponse() {
            const skills = this.knowledgeBase.skills;
            let response = "**Vamsi's Technical Skills:**\n\n";
            
            response += `**Programming:** ${skills.programming.join(', ')}\n\n`;
            response += `**Web Development:** ${skills.webDev.join(', ')}\n\n`;
            response += `**App Development:** ${skills.appDev.join(', ')}\n\n`;
            response += `**Robotics:** ${skills.robotics.join(', ')}\n\n`;
            response += `**ML/AI:** ${skills.ml.join(', ')}\n\n`;
            response += `**CAD/Design:** ${skills.cad.join(', ')}\n\n`;
            response += `**Simulation:** ${skills.simulation.join(', ')}\n\n`;
            response += `**Other:** ${skills.other.join(', ')}\n\n`;
            
            return response;
        }

        formatEducationResponse() {
            const education = this.knowledgeBase.education;
            let response = "**Vamsi's Education:**\n\n";
            
            response += `**Current:** ${education.current}\n\n`;
            response += `**Class 12:** ${education.class12}\n\n`;
            response += `**Class 10:** ${education.class10}\n\n`;
            response += `**Relevant Courses:** ${education.relevantCourses.join(', ')}\n\n`;
            
            return response;
        }

        formatRoboticsResponse() {
            return `**Vamsi's Robotics Expertise:**

🤖 **Current Projects:**
• Smart Wheelchair with EEG/EMG integration
• RIS Simulator development
• Mars Rover navigation systems

🛠️ **Technical Skills:**
• ROS2 programming and system integration
• NVIDIA Isaac Sim for robotics simulation
• MuJoCo for physics simulation
• Autonomous navigation and SLAM
• Control systems and sensor fusion

🎯 **Applications:**
• Autonomous mobile robots
• Brain-computer interfaces
• Drone development and navigation
• Industrial automation systems

Vamsi combines theoretical knowledge with hands-on robotics experience!`;
        }        formatAIResponse() {
            return `**Vamsi's AI/ML Expertise:**

🧠 **Machine Learning:**
• Deep Learning with TensorFlow
• Computer Vision applications
• Data Structures & Algorithms
• Signal processing for EEG/EMG

📊 **Data Analysis:**
• Python (NumPy, Pandas)
• Statistical analysis and modeling
• Research data processing

🚀 **Applied AI Projects:**
• Smart wheelchair control using neural signals
• Mental health app with ML analysis
• Autonomous navigation algorithms
• Stress analysis and pattern recognition

Vamsi applies AI/ML to solve real-world problems in robotics and healthcare!`;
        }

        formatExperienceResponse() {
            const exp = this.knowledgeBase.experience;
            let response = "**Professional Experience:**\n\n";

            exp.forEach(job => {
                response += `**${job.role}**\n`;
                response += `${job.organization} | ${job.period}\n`;
                response += `${job.description}\n\n`;
            });

            return response;
        }        formatHiringResponse() {
            return `**🎯 Why Galaba Vamsi is the PERFECT Candidate for Your Team**

**🚀 IMMEDIATE IMPACT DRIVER**
• **PROVEN RESULTS:** Transformed IIT Bhilai's FPS ranking from 17th to 6th place in just ONE YEAR
• **DELIVERY EXPERT:** Successfully shipped production applications (Polaris website) serving 1000+ users
• **INNOVATION CATALYST:** Leading breakthrough research in RIS technology and brain-computer interfaces
• **MULTI-DOMAIN MASTERY:** Seamlessly bridges hardware, software, AI, and business domains

**💎 EXCEPTIONAL TECHNICAL FOUNDATION**
• **ELITE EDUCATION:** Mechatronics Engineering at IIT Bhilai (India's top engineering institution)
• **CUTTING-EDGE EXPERTISE:** ROS2, NVIDIA Isaac, TensorFlow, React.js, Flutter, Python, C++
• **RESEARCH DEPTH:** Published work in advanced robotics and intelligent systems
• **HANDS-ON BUILDER:** From smart wheelchairs to autonomous rovers - he builds what others only dream about

**🏆 LEADERSHIP DNA & BUSINESS ACUMEN**
• **ENTREPRENEURIAL MINDSET:** Swiggy Campus CEO - drove marketing strategies and user engagement
• **TEAM MULTIPLIER:** Mentored 100+ students, improved team performance across multiple domains
• **STAKEHOLDER MANAGEMENT:** Collaborated with administration, industry partners, and technical teams
• **PROBLEM SOLVER:** Consistently turns complex challenges into elegant, scalable solutions

**⚡ UNIQUE VALUE PROPOSITION**
• **RAPID LEARNER:** Masters new technologies faster than most - from concept to implementation
• **INTERDISCIPLINARY GENIUS:** Combines mechanical engineering, AI, software development, and design thinking
• **GLOBAL PERSPECTIVE:** Understands both technical excellence and market demands
• **FUTURE-READY:** Working on tomorrow's technologies today (autonomous systems, brain interfaces, smart automation)

**💼 PROVEN PROFESSIONAL TRACK RECORD**
• **RESEARCH EXCELLENCE:** Currently driving RIS simulator development at IIT Bhilai
• **INDUSTRY EXPERIENCE:** Real-world exposure through Swiggy partnership and multiple internships
• **PROJECT LEADERSHIP:** Manages complex, multi-stakeholder projects from conception to deployment
• **QUALITY OBSESSED:** Every project demonstrates attention to detail and user-centric design

**🎯 PERFECT FIT FOR ANY ROLE BECAUSE:**
• **TECHNICAL ROLES:** Deep expertise in robotics, AI/ML, full-stack development
• **LEADERSHIP POSITIONS:** Proven ability to inspire teams and drive results
• **RESEARCH & INNOVATION:** Publishing-quality work with practical applications
• **BUSINESS DEVELOPMENT:** Understands technology's commercial impact and market potential
• **CONSULTING:** Can bridge technical complexity with business strategy

**🔥 THE BOTTOM LINE:**
Vamsi isn't just another candidate - he's a **FORCE MULTIPLIER** who will:
✅ Deliver immediate value from day one
✅ Drive innovation and competitive advantage
✅ Mentor and elevate your entire team
✅ Bridge technical excellence with business impact
✅ Become your go-to person for impossible challenges

**When you hire Vamsi, you're not just filling a position - you're investing in a GAME-CHANGER who will transform how your team approaches problems and delivers solutions!**`;
        }

        formatWorkReadinessResponse() {
            return `**Vamsi's Work Readiness:**

✅ **Technically Prepared**
• Strong programming foundation (Python, C++, JavaScript, Dart)
• Experience with modern frameworks (React.js, Node.js, Flutter)
• Robotics expertise with ROS2, NVIDIA Isaac, and simulation tools
• AI/ML skills with TensorFlow, computer vision, and data analysis

✅ **Industry Experience**
• Currently working as Research Intern at IIT Bhilai
• Previous roles: Campus CEO at Swiggy, Website Developer
• Experience with real-world project delivery and stakeholder management

✅ **Leadership & Collaboration**
• Led teams and improved organizational performance
• Mentored junior students and managed cross-functional projects
• Strong communication skills demonstrated through leadership roles

✅ **Continuous Learning**
• Pursuing relevant coursework in Data Structures, ML, Robotics
• Active in technical communities and competitions
• Stays updated with latest technologies and industry trends

**Ready for internships, full-time roles, or project-based work in robotics, software development, or AI/ML!**`;
        }
        
        formatStrengthsResponse() {
            return `**Vamsi\'s Key Strengths & Value Proposition:**

🔧 **Technical Versatility**
• Full-stack development capabilities (Frontend, Backend, Mobile)
• Robotics and automation expertise with real hardware experience
• AI/ML implementation with proven project results
• Strong problem-solving and system design skills

🎯 **Project Delivery**
• Proven track record of completing complex projects on time
• Experience with entire development lifecycle from concept to deployment
• Ability to work with cutting-edge technologies and research
• Integration skills across hardware, software, and AI systems

🤝 **Leadership & Collaboration**
• Demonstrated leadership through measurable improvements (FPS ranking)
• Strong mentoring and knowledge transfer abilities
• Cross-functional collaboration experience
• Excellent communication with technical and non-technical stakeholders

💡 **Innovation & Learning**
• Creative problem-solving approach to complex challenges
• Quick learning and adaptation to new technologies
• Research mindset with contribution to publications and lab work
• Passion for making technology accessible and impactful

**Value Add: Brings both technical depth and leadership experience, with ability to bridge between research/innovation and practical implementation.**`;
        }

        formatContactResponse() {
            const personal = this.knowledgeBase.personal;
            return `**Get in touch with Vamsi:**

📧 **Email:** ${personal.email}
📱 **Phone:** ${personal.phone}
📍 **Location:** ${personal.location}
🔗 **LinkedIn:** linkedin.com/in/${personal.linkedin}
🐙 **GitHub:** github.com/${personal.github}

Feel free to reach out for collaborations, opportunities, or technical discussions!`;
        }

        formatPersonalResponse() {
            const personal = this.knowledgeBase.personal;
            const education = this.knowledgeBase.education; // Added for clarity and use
            return `**About Galaba Vamsi:**

🎓 **${personal.role}** at ${personal.institution}
📍 Currently based in ${personal.location}

**Objective:**
${personal.objective}

**Background:**
Vamsi combines technical expertise with creative problem-solving, specializing in robotics, AI/ML, and automation systems. He's passionate about developing intelligent solutions that can make a real-world impact.

**Current Focus:**
• Autonomous robotics systems and smart automation
• AI-powered computer vision and machine learning applications
• Full-stack development with modern technologies
• Research in RIS technologies and hardware fabrication

**Interests:**
${this.knowledgeBase.interests.map(interest => `• ${interest}`).join('\n')}

**Education:**
Currently pursuing ${education.current}. Key coursework includes:
${education.relevantCourses.map(course => `• ${course}`).join('\n')}`;
        } // Closing brace for formatPersonalResponse method

} // Closing brace for VamsiBotAI class

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            window.vamsiBotAI = new VamsiBotAI();
            console.log('VamsiBotAI initialized successfully');
            
            // Debug: Test hiring response immediately after initialization
            console.log('Testing hiring response after initialization...');
            const testResponse = window.vamsiBotAI.generateResponse('should i hire vamsi?');
            console.log('Test hiring response:', testResponse ? testResponse.substring(0, 100) + '...' : 'No response generated for hiring test'); 
            
        } catch (error) {
            console.error('Error initializing VamsiBotAI:', error);
            const body = document.querySelector('body');
            if (body) {
                // Clear existing body content to show only the error
                body.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #1a1a1a; color: #e0e0e0; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: Arial, sans-serif; padding: 20px; box-sizing: border-box; z-index: 10000; text-align: center;">
                        <h1 style="color: #ff4d4d; font-size: 24px;">A Critical Error Occurred</h1>
                        <p style="font-size: 16px; margin-bottom: 15px;">The VamsiBot chatbot could not start due to an internal script error.</p>
                        <p style="font-size: 14px; color: #b0b0b0;">Details have been logged to the browser console.</p>
                        <pre style="background-color: #333; color: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; max-width: 90%; text-align: left; max-height: 200px; overflow-y: auto;">${error.name}: ${error.message}\n${error.stack ? error.stack.split('\n').slice(0,5).join('\n') : ''}</pre>
                        <p style="margin-top: 20px; font-size: 14px;">Please try refreshing the page.</p>
                    </div>`;
            }
        }
    }, 3000); // Increased timeout to ensure loading is complete
});
