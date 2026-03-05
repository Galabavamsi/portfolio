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
    // AI CHATBOT — Powered by Bytez API (openai/gpt-oss-20b)
    // ================================

    const BYTEZ_API_KEY = "a2b2438a59047e659c9a278c1b9fa1c5";
    const BYTEZ_MODEL   = "openai/gpt-oss-20b";
    const BYTEZ_API_URL = `https://api.bytez.com/models/v1/${BYTEZ_MODEL}/chat/completions`;

    const SYSTEM_PROMPT = `You are VamsiBot, the AI assistant embedded in Galaba Vamsi's personal portfolio website.
Your job is to answer questions about Vamsi accurately, enthusiastically, and concisely.
Always respond in the first-person-about-Vamsi style (e.g. "Vamsi is..." or "He has...").
Keep responses under 200 words unless a detailed breakdown is explicitly requested.
Use bullet points and bold text (**like this**) for readability.

=== GALABA VAMSI — FULL PROFILE ===

**Name:** Galaba Vamsi
**Role:** Mechatronics Undergraduate, IIT Bhilai (2023–2027)
**Contact:** galabavamsi@iitbhilai.ac.in | +91 7483047846
**LinkedIn:** galaba-vamsi-334758211 | **GitHub:** Galabavamsi
**Blog:** galabavamsi.github.io/blog

**SUMMARY:**
Results-driven Mechatronics undergraduate bridging Machine Learning, Robotics (ROS2/Isaac Sim), and Software Engineering. IEEE INDICON 2025 published researcher (First Author) in 6G RIS systems. Top 3.5% at Amazon ML Challenge (700/20,000+ teams). Building GNN architectures for protein modelling and open-source 6G simulators.

**EDUCATION:**
- B.Tech Mechatronics, IIT Bhilai (2023–2027)
- Coursework: DLCV, AI & ML, DIP, Optimal Control, Control Systems, DSA, Robotics Systems

**EXPERIENCE:**
- Research Intern – 6G RIS Simulator & Testbed, IIT Bhilai (May–Aug 2025)
  → Zero-budget open-source RIS simulator emulating USRPs, saving lakhs in hardware costs
  → Published First Author & Co-Author IEEE INDICON 2025
  → Custom two-layer RIS PCB with DipTrace/CST for RF energy harvesting
- Team Lead – Arista Wi-Fi Optimization (Inter IIT Tech Meet 14.0) → 5th Rank

**PROJECTS:**
1. **AI-Powered Electron Interaction in Protein Structures** (2025–Present) — GNN architectures for quantum chemistry / protein modelling
2. **Open-Source 6G RIS Simulator & Testbed** (2025) — IEEE INDICON, SDR/USRP, custom PCB
3. **Amazon ML Challenge – Top 3.5%** (2025) — Qwen 2-VL 7B + RoBERTa, SMAPE 49.0, 75k data pairs
4. **Shared-Action Autonomous Smart Wheelchair** (2025) — ROS2, Isaac Sim, MuJoCo, deep learning signal processing
5. **Serenity Mental Health App** (2024) — Open-source Flutter app, CV emotion detection, doctor booking

**SKILLS:**
- AI/ML: PyTorch, GNN, Safe RL, Transformers (Qwen VL, ViT, RoBERTa), Bayesian Optimization, OpenCV
- Robotics: ROS2, NVIDIA Isaac Sim, MuJoCo, PLC, Drone Dev, DipTrace, CST, PCB Design, SolidWorks
- 6G/Networks: Wi-Fi PHY/MAC, IEEE 802.11k/v, SDR/USRP, OBSS-PD, RIS, Linux, Signal Processing
- Web/App: React.js, Node.js, Three.js, WebGL, Flutter, Flask, REST APIs
- Languages: Python, C/C++, JavaScript, Dart, Go, MATLAB, Bash

**PUBLICATIONS:**
- First Author: "An Open Emulator for Smart Radio Environments" — IEEE INDICON 2025
- Co-Author: "Experience with RF Energy Harvesting-Driven Self-Powered RIS" — IEEE INDICON 2025

**ACHIEVEMENTS:**
- 🥇 5th Rank — Arista Networks Wi-Fi Optimization, Inter IIT Tech Meet 14.0
- 🎖️ Top 3.5% — Amazon ML Challenge 2025 (700/20,000+ teams)
- 🏆 Top 10 Finalist — Toyota Hackathon

**INTERESTS:** Badminton (champion), Sci-Fi reading (Dune, The Martian), Film & Photography, Game Design, Blender/Unreal Engine
=== END PROFILE ===`;

    class VamsiBotAI {
        constructor() {
            this.chatHistory = []; // stores {role, content} for the API
            this.isTyping    = false;
            this.initializeChatbot();
        }

        initializeChatbot() {
            this.chatbotContainer   = document.getElementById('chatbot-container');
            this.chatbotToggle      = document.getElementById('chatbot-toggle');
            this.chatbotClose       = document.getElementById('chatbot-close');
            this.chatbotMessages    = document.getElementById('chatbot-messages');
            this.chatbotInput       = document.getElementById('chatbot-input');
            this.chatbotSend        = document.getElementById('chatbot-send');
            this.suggestionButtons  = document.querySelectorAll('.suggestion-btn');
            this.bindEvents();
        }

        bindEvents() {
            this.chatbotToggle.addEventListener('click', () => this.toggleChatbot());
            this.chatbotClose.addEventListener('click',  () => this.closeChatbot());
            this.chatbotSend.addEventListener('click',   () => this.handleUserMessage());
            this.chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleUserMessage(); }
            });
            this.suggestionButtons.forEach(btn => {
                btn.addEventListener('click', () => this.simulateUserMessage(btn.getAttribute('data-question')));
            });
        }

        toggleChatbot() {
            this.chatbotContainer.classList.contains('chatbot-hidden') ? this.openChatbot() : this.closeChatbot();
        }
        openChatbot()  { this.chatbotContainer.classList.remove('chatbot-hidden'); this.chatbotToggle.style.display = 'none';  this.chatbotInput.focus(); }
        closeChatbot() { this.chatbotContainer.classList.add('chatbot-hidden');    this.chatbotToggle.style.display = 'flex'; }

        handleUserMessage() {
            const message = this.chatbotInput.value.trim();
            if (!message || this.isTyping) return;
            this.chatbotInput.value = '';
            this.sendMessage(message);
        }

        simulateUserMessage(message) { this.sendMessage(message); }

        async sendMessage(userText) {
            this.addMessage(userText, 'user');
            this.showTypingIndicator();

            // Append to history for multi-turn context
            this.chatHistory.push({ role: 'user', content: userText });

            try {
                const messages = [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...this.chatHistory
                ];

                const response = await fetch(BYTEZ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Key ${BYTEZ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ messages })
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`Bytez API error ${response.status}: ${err}`);
                }

                const data = await response.json();
                // Support both streaming and non-streaming response shapes
                const assistantText =
                    data?.choices?.[0]?.message?.content ||
                    data?.output ||
                    "I couldn't fetch a response right now. Please try again!";

                this.chatHistory.push({ role: 'assistant', content: assistantText });
                this.hideTypingIndicator();
                this.addMessage(assistantText, 'bot');

            } catch (error) {
                console.error('VamsiBot API error:', error);
                this.hideTypingIndicator();
                this.addMessage("⚠️ Connection error. Please check your network and try again.", 'bot');
                // Remove the failed user message from history so it can be retried
                this.chatHistory.pop();
            }
        }

        addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;

            const prefix = document.createElement('span');
            prefix.className = 'message-prefix';
            prefix.textContent = sender === 'user' ? '[User]:' : '[VamsiBot]:';

            const messageText = document.createElement('span');
            messageText.className = 'message-text';

            if (sender === 'bot') {
                messageText.innerHTML = text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
            } else {
                messageText.textContent = text;
            }

            messageDiv.appendChild(prefix);
            messageDiv.appendChild(messageText);
            this.chatbotMessages.appendChild(messageDiv);
            this.scrollToBottom();
        }

        showTypingIndicator() {
            this.isTyping = true;
            const div = document.createElement('div');
            div.className = 'message bot-message typing-indicator';
            div.id = 'typing-indicator';
            div.innerHTML = '<span class="message-prefix">[VamsiBot]:</span><span class="loading-content"><span class="spinner">⟳</span> Thinking...</span>';
            this.chatbotMessages.appendChild(div);
            this.scrollToBottom();
        }

        hideTypingIndicator() {
            this.isTyping = false;
            const el = document.getElementById('typing-indicator');
            if (el) el.remove();
        }

        scrollToBottom() { this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight; }
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            try {
                window.vamsiBotAI = new VamsiBotAI();
                console.log('VamsiBotAI (Bytez-powered) initialized successfully');
            } catch (error) {
                console.error('Error initializing VamsiBotAI:', error);
            }
        }, 3000);
    });

