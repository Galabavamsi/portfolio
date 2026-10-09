/* ============================================================
   BIT - small portfolio assistant + optional remote chat.
   It always has a local resume-aware fallback, so the chat works
   even when the deployed endpoint is unavailable during local dev.
   ============================================================ */
(() => {
  'use strict';

  const SCRIPT_URL = document.currentScript ? document.currentScript.src : location.href;

  const GVC = window.GV_CONFIG || {};
  const CFG = {
    endpoint: (GVC.CHAT_ENDPOINT && !GVC.CHAT_ENDPOINT.includes('YOUR-')) ? GVC.CHAT_ENDPOINT : '',
    devKey: GVC.DEV_DEEPSEEK_KEY || '',
    useRemoteLocally: !!GVC.USE_REMOTE_CHAT_LOCALLY,
  };
  const LOCAL_ORIGIN = ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
    window.location.protocol === 'file:';

  const GV = window.GV || { unlock() {}, addScore() {}, audio: { blip() {}, nav() {}, coin() {}, eat() {} } };
  const $ = s => document.querySelector(s);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LINKS = {
    email: 'mailto:galabavamsi12@gmail.com',
    portfolio: 'https://galabavamsi.github.io/portfolio',
    techProfile: 'https://galabavamsi.github.io/portfolio/#home',
    filmProfile: 'https://galabavamsi.github.io/portfolio/#film',
    linkedin: 'https://www.linkedin.com/in/galabavamsi/',
    github: 'https://github.com/Galabavamsi',
    twitter: 'https://x.com/Galaba_Vamsi',
    instagram: 'https://www.instagram.com/galaba_vamsi/',
    instagramReels: 'https://www.instagram.com/galaba_vamsi/reels/',
    youtube: 'https://www.youtube.com/@galabavamsi12',
    fpsChannel: 'https://www.youtube.com/@fps_iitbh',
    asita: 'https://www.instagram.com/asita_productions/',
    scholar: 'https://scholar.google.com/citations?user=UNjZa1sAAAAJ&hl=en',
    researchgate: 'https://www.researchgate.net/profile/Galaba-Vamsi',
    ieeeAuthor: 'https://ieeexplore.ieee.org/author/943675488152924',
    resume: 'resume_vamsi.pdf',
    ris: 'https://github.com/Galabavamsi/RIM-SIM-V2',
    risV1: 'https://github.com/Galabavamsi/RIS-SIM',
    hflow: 'https://github.com/Hebbian-Robotics/hflow',
    hflowContributions: 'https://github.com/Hebbian-Robotics/hflow/pulls?q=is%3Apr+author%3AGalabavamsi',
    robocurve: 'https://robocurve.org/',
    robocurveYc: 'https://www.ycombinator.com/companies/robocurve',
    inspectRobots: 'https://github.com/robocurve/inspect-robots',
    inspectRobotsContributions: 'https://github.com/robocurve/inspect-robots/pulls?q=is%3Apr+state%3Aopen+author%3AGalabavamsi',
    inspectRobotsPrs: 'https://github.com/robocurve/inspect-robots/pulls?q=is%3Apr+author%3AGalabavamsi',
    wandbPypi: 'https://pypi.org/project/inspect-robots-wandb/',
    wandbGithub: 'https://github.com/Galabavamsi/inspect-robots-wandb',
    cerulion: 'https://github.com/cerulion-inc/cerulion',
    cerulionPrs: 'https://github.com/cerulion-inc/cerulion/pulls?q=is%3Apr+author%3AGalabavamsi',
    humanSlop: 'https://humanslop.in/',
    humanSlopApp: 'https://play.google.com/store/apps/details?id=com.humanslop.app',
    aristaSlides: 'https://canva.link/puoqbe4okoid8rb',
    electronGnn: 'https://github.com/Galabavamsi/Electron-GNN',
    openPyfx: 'https://github.com/Galabavamsi/open-pyfx',
    crater: 'https://github.com/Galabavamsi/Moon-Crater-Detection-using-DEM',
    antenna: 'https://github.com/Galabavamsi/Antenna-Net',
    serenity: 'https://github.com/Galabavamsi/Serenity',
    charter: 'https://github.com/Galabavamsi/charter',
    quarterCar: 'https://github.com/Galabavamsi/quarter-car-afc-replication',
    quarterCarSite: 'https://quarter-car-afc.vercel.app',
    whiteboardRobot: 'https://github.com/Galabavamsi/whiteboard_robot',
    promptArm: 'https://github.com/Galabavamsi/prompt-robot-arm',
    digitalTwin: 'https://github.com/Galabavamsi/pneumatic-sorting-digital-twin',
    heatcast: 'https://github.com/Galabavamsi/heatcast',
    heatcastDemo: 'https://web-pearl-ten-99.vercel.app',
    pondPlanning: 'https://github.com/Galabavamsi/ai-village-pond-planning',
    blog: 'https://galabavamsi.github.io/portfolio/blog/',
    blogWandb: 'https://galabavamsi.github.io/portfolio/blog/inspect-robots-wandb.html',
    openEmulator: 'https://drive.google.com/file/d/12oDPsflaUXKnSjfA3247HgFDDf4bJkCP/view?usp=drive_link',
    risEnergy: 'https://ieeexplore.ieee.org/abstract/document/11392908/',
    risReview: 'https://www.sciencedirect.com/science/article/pii/S1570870526001964',
    grayAura: 'https://www.youtube.com/watch?v=ZRrBCcASFnA',
    god: 'https://youtu.be/-WPj4VcHnSs',
    reverie: 'https://youtu.be/X63npde0tC8',
    lottery: 'https://youtu.be/neheCtcgAfw',
    tohfa: 'https://youtu.be/bAIMAUsxbjE',
    fresherIntro: 'https://youtu.be/g7hVDZTYmq0',
    animalSuccession: 'https://youtu.be/ONRd5ax9iXw',
    asyncFilm: 'https://youtu.be/HAzgRXeCtuI',
    successfulFailure: 'https://youtu.be/ZOxLzjBaoKc',
    coreMemories: 'https://youtu.be/qLJkAH8nXMg',
    mudane: 'https://youtu.be/9foVftC4LJs',
    trip: 'https://youtu.be/XAaaViNTpWc',
    journeyMind: 'https://youtu.be/7GcstdUX7UE',
    losers: 'https://youtu.be/66JtvPzybow',
    theEnd: 'https://youtu.be/ER3DwZ469TY',
    happyDeepavali: 'https://youtu.be/LOgHtpYJypw',
    prayatna: 'https://youtu.be/3wTTq6JrtQs',
    prayatnaV2: 'https://youtu.be/IpJYDcB0L9E',
    prayatnaV3: 'https://youtu.be/llhwHbiQI38',
    prayatnaAlt: 'https://youtu.be/dliJ7sz_Taw',
    tripAlt: 'https://youtu.be/vznfDWRf3RI',
    randomshit: 'https://youtu.be/Lg4jWclYDZE',
    randomshit1: 'https://youtu.be/UU9OkEUBNs0',
    innocence: 'https://youtu.be/xaVmTJU2Pxw',
  };

  const FACTS = {
    summary: 'Mechatronics at IIT Bhilai. Open-source contributor to robotics tools. Galaba Vamsi is a B.Tech Mechatronics student at IIT Bhilai, graduating in May 2027. He has 15 merged pull requests across HFlow (robot data), Inspect Robots (evaluation), and Cerulion (runtime), plus inspect-robots-wandb, a community plugin for Inspect Robots that he wrote and publishes on PyPI. His own robotics and controls work is in simulation so far (ROS 2 and Gazebo, MuJoCo, Unity, MATLAB/Simulink). His research is in RF: an open-source emulator for RIS-assisted radio links and two co-authored RIS papers. He also co-founded Human Slop. The site has a Tech profile and a Film profile; switch between them with the Tech and Film buttons in the header.',
    filmSummary: 'Vamsi is a filmmaker, editor, director, writer, and Mechatronics student at IIT Bhilai. He works across narrative short films, music videos, campus films, startup/product content, social-first reels, video essays, and visual experiments. His technical background in robotics, AI/ML, computer vision, and software helps him work across both the creative and technical sides of production.',
    filmWorkflow: 'Vamsi can take a project from idea to script, shot planning, direction, camera/production, edit, sound and visual polish, and final publishing. His strongest creative combination is filmmaking and visual storytelling, writing and directing, editing and post-production, social-first instincts, technical fluency, and fast production under difficult constraints.',
    grayAura: 'Gray Aura is an official music video for Godchild and Thrsdae, produced by Asita Production. Vamsi directed it with Harshal Singh, contributed cinematography with Harshal Singh and Aditya Singh, and edited it. Video: ' + LINKS.grayAura + '. Asita Productions: ' + LINKS.asita + '.',
    fpsFilms: 'Vamsi worked with FPS — IIT Bhilai as a director, editor, and writer. The team made films under the Inter-IIT 51-hour format, developing, shooting, and editing complete films under extreme time constraints. Key films include गोद (' + LINKS.god + '), REVERIE (' + LINKS.reverie + '), Lottery (' + LINKS.lottery + '), TOHFA (' + LINKS.tohfa + '), and Fresher\'s Introduction 2024 (' + LINKS.fresherIntro + '). FPS channel: ' + LINKS.fpsChannel + '.',
    filmArchive: 'Personal film and video work includes Animal Succession edit (' + LINKS.animalSuccession + '), ASYNC — a Backrooms lore short film made in approximately four hours (' + LINKS.asyncFilm + '), A Successful Failure (' + LINKS.successfulFailure + '), Core Memories (' + LINKS.coreMemories + '), MUDANE — a Sony FX30 experiment (' + LINKS.mudane + '), TRIP — Fuji XT3 (' + LINKS.trip + '), A Journey Through Mind (' + LINKS.journeyMind + '), LOSERS — Fuji XT3 (' + LINKS.losers + '), THE END — Fuji XT3 (' + LINKS.theEnd + '), Happy Deepavali (' + LINKS.happyDeepavali + '), PRAYATNA 6.0 versions, RANDOMSHIT, and INNOCENCE. The public collection is on ' + LINKS.youtube + '.',
    socialLinks: 'Creative links: Instagram ' + LINKS.instagram + ', Instagram Reels ' + LINKS.instagramReels + ', personal YouTube ' + LINKS.youtube + ', FPS channel ' + LINKS.fpsChannel + ', X/Twitter ' + LINKS.twitter + ', and Asita Productions ' + LINKS.asita + '.',
    researchProfiles: 'Research profiles: Google Scholar ' + LINKS.scholar + ', ResearchGate ' + LINKS.researchgate + ', and IEEE Xplore author profile ' + LINKS.ieeeAuthor + '.',
    profileSwitch: 'The portfolio has separate Tech and Film profiles. Tech covers open-source contributions, robotics and simulation projects, experience, research and publications, writing, and skills. Film covers direction, writing, editing, cinematography, music videos, campus films, startup content, and visual experiments. Use the Tech and Film buttons in the header, or open ' + LINKS.filmProfile + ' for the film profile.',
    experience: 'Paid Research Intern at IIT Bhilai from May to July 2025, advisor Dr. Arzad Alam Kherani, on a COMET Foundation-sponsored project on Smart Radio Environments. Vamsi built RIS-SIM, an open-source Python emulator for RIS-assisted radio links in LoS/NLoS scenarios, with USRP-style SDR interfaces so experiments can be prototyped before touching radio hardware. He designed RIS unit cells in CST Studio Suite for the lab\'s RF energy-harvesting work, reported in IEEE INDICON 2025 (co-author). In 2026, he rebuilt the emulator as RIS-SIM v2: six paper-grounded scenarios, a 20 Hz WebSocket dashboard, a ZeroMQ server, and 103 tests. RIS-SIM v2: ' + LINKS.ris + '. v1: ' + LINKS.risV1 + '.',
    swiggy: 'Vamsi was a Marketing Intern for the Swiggy Campus CEO program from April to July 2024, where he executed a campus campaign of 15 social media posts.',
    hflow: 'HFlow is an open-source SDK from Hebbian Robotics (YC S26) for verifying the quality of robot training data. Vamsi is a contributor, not its author: from Sep to Oct 2026 he had 8 pull requests merged after maintainer review: #350, #353, #360, #362, #367, #400, #598, and #657. Most of them make robot-log and LeRobot conversion keep data whole or refuse it with a clear reason. PR #657 resolved issue #656 by typing Arrow columns from all messages, preserving fields introduced after startup and rejecting incompatible shapes. PR #598 resolved issue #597 by refusing sources with multiple channels on one topic before canonical episode creation, adding doctor diagnostics, and bumping TRANSFORM_BEHAVIOR_VERSION to 10. PR #400 resolved issue #399 by refusing LeRobot depth videos before conversion when depth markers are present, preserving the existing RGB path and preventing silent loss of 12-bit depth values. PR #367 resolved issue #365 with a reproducible cold camera_frame_stats benchmark (3 cold 1080p30 checks, 900 decoded frames each, 4.897 s median); it reported no repeatable semantics-preserving speedup and left the shipped filter graph unchanged. HFlow: ' + LINKS.hflow + '. His HFlow PRs: ' + LINKS.hflowContributions + '.',
    robocurve: 'Robocurve is an active YC Summer 2026 company in San Francisco and a Public Benefit Corporation building open-source tools and independent benchmarks for physical AI. Website: ' + LINKS.robocurve + '. YC: ' + LINKS.robocurveYc + '.',
    inspectRobots: 'Inspect Robots is Robocurve\'s MIT-licensed open-source evaluation framework for physical AI. It runs policies on real or simulated embodiments with auditable logs and Rerun visualization, and its CI gates merges on 100% core test coverage, strict mypy, and ruff. Repository: ' + LINKS.inspectRobots + '.',
    inspectRobotsContribution: 'Vamsi has 6 PRs on Inspect Robots: 2 merged, 3 open, and 1 closed by agreement with the maintainers. Merged: #475 (preserve unknown git provenance in eval logs, closes issue #473) and #476 (configurable retry policy for the LLM agent across five wire protocols, honoring Retry-After, closes issue #441). Open: #514 (open, in review: explicit checkpoint and resume for long eval sets, retrying only recoverable policy errors and never after safety aborts, about 4,100 lines, closes issue #136), #550 (open: optional on_eval_error sink hook for aborted runs), and #551 (open: docs listing community plugins, starting with inspect-robots-wandb). Closed: #434, the original in-repo W&B sink, which the maintainers asked to ship as an external package. All his Inspect Robots PRs: ' + LINKS.inspectRobotsPrs + '. Only the 2 merged PRs are accepted; the 3 open PRs are not merged yet. He is also a co-author of the paper "Inspect Robots: Evaluating the Capabilities and Safety of Embodied AI", submitted to the CoRL 2026 Workshop SPAIS and under review; it is not accepted yet.',
    wandb: 'inspect-robots-wandb v0.1.0, published on PyPI on 2026-10-03, is a community Weights & Biases logging plugin for Inspect Robots that Vamsi wrote and maintains. Each evaluation becomes one W&B run holding the full eval spec as config, plus status, scene and trial counts, errored trials, total steps, duration, and every aggregate metric. It started as PR #434; the maintainers asked for the sink to live outside the core, so he published it as its own package. It registers via plugin entry points and has a 100% coverage gate, CI on Python 3.10 to 3.13, and PyPI trusted publishing. PyPI: ' + LINKS.wandbPypi + '. Source: ' + LINKS.wandbGithub + '. Article: ' + LINKS.blogWandb + '.',
    // Word order matters: the chat function drops the whole context if a language
    // name is followed within 100 characters by "code" (its UNSAFE_PATTERNS).
    cerulion: 'Cerulion records a robot run and re-executes it against new code; it is an open-source robot runtime written in Rust (iceoryx2 shared memory, ROS 2 interop). Vamsi has 5 merged PRs there and none open: one CLI fix and four documentation and comment corrections. #216 (the CLI fix) made ros2 attach --dry-run run outside a workspace, with an exclusive temporary root and RAII cleanup; #220 clarified workspace-root comments; #222 replaced 26 em dashes in an rmw_cerulion test file\'s comments so it passes the repo\'s ASCII-only public-surface check; #224 corrected stale USER_API references; #226 documented fail-closed CERULION_NETWORK behavior. Repository: ' + LINKS.cerulion + '. His Cerulion PRs: ' + LINKS.cerulionPrs + '.',
    openSource: 'Current PR status: 15 merged pull requests in total. HFlow has 8 merged PRs, most recently #657. Cerulion has 5 merged PRs (one CLI fix and four documentation and comment corrections) and none open. Inspect Robots has 2 merged PRs and 3 open: #514 (open, in review), #550 (open), and #551 (open). He also wrote and maintains inspect-robots-wandb on PyPI. HFlow PRs: ' + LINKS.hflowContributions + '. Cerulion PRs: ' + LINKS.cerulionPrs + '. Inspect Robots open PRs: ' + LINKS.inspectRobotsContributions + '.',
    humanSlop: 'Human Slop is an anti-AI social app for human-written posts. Vamsi co-founded it in 2026 and is co-building it with his co-founder: an Expo (React Native) app for web and Android, a Fastify API, and PostgreSQL on Supabase, deployed on Render and Cloudflare. It is live on the web and Google Play (50+ downloads). Vamsi attended YC Startup School in Bengaluru. He added a device biometric check at signup (the OS Face ID or fingerprint prompt, tied to a registered device) and a keystroke-timing score in the editor (typing variance, pauses, paste attempts). Both are heuristics, not proof of authorship. Web: ' + LINKS.humanSlop + '. App: ' + LINKS.humanSlopApp + '.',
    arista: 'Arista Wi-Fi RRM (2025) was a team project for Arista\'s problem at Inter IIT Tech Meet 14.0, where the team placed 5th (Dec 2025): client-aware Wi-Fi radio resource management in NS-3, with I/Q-based interference classification (STFT, DBSCAN, Dual-CNN; 16 classes) on a 5-AP, 50-client 802.11k/v topology. Slides: ' + LINKS.aristaSlides,
    charter: 'Charter (2026) is a Razorpay AI Buildathon prototype: chat, voice, and MCP (10 tools) share one bounded commerce core with frozen INR quotes, Razorpay test-mode payments, audit trails, and row-level security. GitHub: ' + LINKS.charter + '.',
    quarterCar: 'The Quarter-Car Active Suspension Study (2026) is an Advanced Control Theory course project, simulation only. The project reproduced Na et al. (IEEE TSMC 2022) approximation-free active suspension control in MATLAB/Simulink: after fitting two plant parameters to the paper\'s Case-10 experiment, the unchanged controller lands within about 6% of its error indices (IAE 0.129 vs 0.122). It then tested the claims: the paper\'s Case-B gains fail a hold-out test, LQR and skyhook baselines match or beat it at equal effort, and an anti-windup extension keeps the wheel on the road over a 50 mm bump. It includes a C port timed for a Cortex-M4, a FreeCAD rig, and a browser lab. Site: ' + LINKS.quarterCarSite + '. GitHub: ' + LINKS.quarterCar + '.',
    whiteboardRobot: 'The Whiteboard Cleaning Robot (2025) is Vamsi\'s main ROS 2 project, built with Gajanand Kumawat: a 3-DOF Cartesian gantry that cleans a 90 × 90 cm whiteboard, simulated in ROS 2 Jazzy and Gazebo Harmonic, with a URDF/Xacro model, ros2_control, a raster path with 10 cm overlap, and coverage analysis from logged data. GitHub: ' + LINKS.whiteboardRobot + '. Separately, his Cerulion PR #216 made ros2 attach --dry-run run outside a workspace.',
    promptArm: 'Prompt Robot Arm (2026) is a kinematic MuJoCo simulation: a prompt such as "sort red, blue, green" is parsed (rule-based for now) into a plan and a pick-and-place sequence. It moves from a kinematic gripper to a SCARA arm with analytic inverse kinematics. GitHub: ' + LINKS.promptArm + '.',
    digitalTwin: 'The Pneumatic Sorting Digital Twin (offline simulation, 2026) is a Unity simulation of three electropneumatic training kits (sorting, stamping, vacuum transfer): simulated axes, logical PLC I/O, HMI screens, and telemetry record and replay. It is not yet connected to a physical PLC. GitHub: ' + LINKS.digitalTwin + '.',
    heatcast: 'HeatCast (2026) is a hackathon team project (FortyGuard Hackathon\'26, Team HumanSlop): a neighborhood heat-planning scorecard for US planners combining thermal maps, heat-exceedance and streak analysis, vulnerability data, indoor sites, and walking routes. GitHub: ' + LINKS.heatcast + '. Demo: ' + LINKS.heatcastDemo + '.',
    pondPlanning: 'AI Village Pond Planning is a terrain-only backend API that turns contour maps into pond-site and catchment recommendations using metric projection, elevation-grid interpolation, D8 flow routing, and GeoJSON outputs. GitHub: ' + LINKS.pondPlanning + '.',
    antenna: 'AntennaNet (2026) is inverse antenna design: a surrogate network plus KD-tree nearest-neighbour anchoring over about 2,000 simulated patch-antenna S11 spectra, extended to 12 × 12-pixel (144-dimensional) layouts with a separate method-of-moments dataset, plus MEEP scripts for dataset generation. GitHub: ' + LINKS.antenna + '.',
    crater: 'Lunar Crater Detection (2026) extracts craters from lunar DEMs, reproducing Zhou et al. (2018): F1 0.839 on a 16-crater labelled region in Mare Serenitatis (13 true positives, 2 false positives, 3 misses); an optional CuPy path makes preprocessing about 4× faster. GitHub: ' + LINKS.crater + '.',
    openPyfx: 'Open-PyFX (2026) is a GPU video-effects app in Python, ModernGL, and GLSL: CRT emulation using bundled CRT 3D LUT colour profiles, ASCII edge detection, and 4K export. GitHub: ' + LINKS.openPyfx + '.',
    electronGnn: 'Electron-GNN (2026) is an in-progress team project (advisor: Dr. Soumajit Pramanik): a two-tower graph neural network (GATv2) that predicts absorption-spectrum peaks from molecular geometry, so far trained and checked on two small molecules (water and ammonia). GitHub: ' + LINKS.electronGnn + '.',
    amazonMl: 'Amazon ML Challenge (team entries): AIR 200 in 2026. In 2025, team rank 700 (20,000+ registered participants) with a Qwen2-VL 7B and ViT/RoBERTa two-tower model for product price prediction.',
    serenity: 'Serenity (2024) is a team project: a Flutter wellness app with an on-device TFLite mood classifier from the camera, a stress questionnaire, exercises, games, and an expert-contact screen. GitHub: ' + LINKS.serenity + '.',
    projects: 'Featured work: HFlow contributions (8 merged PRs), inspect-robots-wandb plus Inspect Robots contributions, the Quarter-Car Active Suspension Study (course project, simulation), and the RIS-SIM v2 emulator. Other projects: Whiteboard Cleaning Robot (ROS 2 and Gazebo simulation, with Gajanand Kumawat), Prompt Robot Arm (MuJoCo simulation), Pneumatic Sorting Digital Twin (offline simulation), Charter, HeatCast (team), Arista Wi-Fi RRM (team), AntennaNet, Lunar Crater Detection, AI Village Pond Planning, Open-PyFX, Electron-GNN (team, in progress), Amazon ML Challenge (team), and Serenity (team, 2024). He also co-founded Human Slop.',
    skills: 'Robotics, simulation, and controls: ROS 2 (rclpy, ros2_control, URDF/Xacro), Gazebo Harmonic, MuJoCo, Unity (C#), MATLAB/Simulink, LQR and Kalman filter design, LeRobot datasets. Languages: Python, TypeScript/JavaScript, C/C++, Rust (open-source contributions), SQL, GLSL. ML, data, and scientific computing: PyTorch, PyTorch Geometric, OpenCV, NumPy, CuPy, Apache Arrow, Weights & Biases, MEEP (FDTD), CST Studio Suite, NS-3. Software, cloud, and tooling: FastAPI, Node.js (Fastify), React, React Native (Expo), Flutter, PostgreSQL, Supabase, WebSockets, Docker, AWS (CDK, Lambda, Step Functions, Bedrock), Git, Linux, GitHub Actions, pytest, Ruff, mypy, PyPI trusted publishing.',
    education: 'Education: B.Tech in Mechatronics at IIT Bhilai, Aug 2023 to May 2027. Coursework includes DSA, OOP, Deep Learning for Computer Vision, AI and ML, Digital Image Processing, Optimal Control, and Advanced Control Theory.',
    achievements: 'Highlights: AIR 200 in the Amazon ML Challenge 2026 (team); 5th place in the Arista Networks Wi-Fi challenge at Inter IIT Tech Meet 14.0 (team, Dec 2025); AIR 700 in the Amazon ML Challenge 2025 (team; 20,000+ participants); 1st place in the IIT Bhilai Web Development Competition; top 10 finalist at the Toyota Hackathon; top 1% in JEE Advanced; Prime Minister\'s Scholarship Scheme (PMSS) scholar, 2024. Academics: 95% in Class 12 and 94% in Class 10.',
    publications: 'Publications, in order: (1) co-author, "Experience with RF Energy Harvesting-Driven Self-Powered RIS", IEEE INDICON 2025 (' + LINKS.risEnergy + '); (2) co-author, "A systematic literature review on simulation models and deployments for reconfigurable intelligent surfaces", Ad Hoc Networks (Elsevier), 2026 (' + LINKS.risReview + '); (3) co-author, submitted and under review, not yet accepted: "Inspect Robots: Evaluating the Capabilities and Safety of Embodied AI", CoRL 2026 Workshop SPAIS; (4) first author, a manuscript that is not yet published, with an arXiv preprint in preparation: "An Open Emulator for Smart Radio Environments" (draft: ' + LINKS.openEmulator + ').',
    contact: 'Best contact: galabavamsi12@gmail.com or LinkedIn. Phone from resume: +91 7483047846. He is open to robotics software internships and new-grad roles (graduating May 2027), and to research collaborations. He reads the code, writes the tests, and says plainly what did not work.',
    blog: 'The blog holds build logs, one post per experiment. The first post covers Physical AI experiment 01: a 1.9M-parameter JEPA world model reproducing the LeWorldModel recipe on Push-T, trained in about 7 minutes on an 8 GB laptop RTX 4070. Training was stable and collapse-free, the latent space encoded agent position without supervision, action ablations confirmed the predictor uses control input, but held-out rollouts drifted after about 2 steps and CEM planning reached 0.000 coverage because the data had almost no goal-directed pushing. Blog: ' + LINKS.blog + '.',
  };

  // Sent with every remote question. buildContext() appends FACTS after it.
  const SYSTEM_HEAD = `You are BIT, a small portfolio assistant on Galaba Vamsi's website.

STYLE RULES:
- Replies under 80 words. Plain text only. No markdown and no emoji.
- Be warm, direct, and easy to understand.
- Be accurate about Vamsi. Never invent facts not listed below. If the facts below do not cover a question, say you do not have that detail and point to the portfolio.
- Only call a PR merged if the facts say merged. Describe open PRs as open or in review; never call them approved or accepted.
- The website has separate Tech and Film profiles. Tell visitors to use the Tech/Film switcher when relevant.
- If asked something unrelated to Vamsi or this site, answer briefly, then offer to help with Vamsi's work, projects, skills, or contact details.

ACCURACY NOTES:
- Do not claim Vamsi worked at PinkSauce Studios. He reached the final round for a Filmmaker Intern role; it did not become employment.
- Do not claim a specific role on the Homeie reel unless the user provides confirmation.
- Do not invent a single showreel URL; the YouTube channel and portfolio archive are the public reel collection.
- Treat follower, view, and engagement numbers as dated snapshots, not current metrics.
- Vamsi contributes pull requests to HFlow, Inspect Robots, and Cerulion. He did not build or author those projects. He did write inspect-robots-wandb.
- His robotics and controls projects are simulations; call them simulations. The Pneumatic Sorting Digital Twin is an offline simulation, not connected to hardware.
- Label team work as team work: Arista Wi-Fi RRM, HeatCast, Electron-GNN, Amazon ML Challenge, and Serenity are team projects, the whiteboard robot was built with Gajanand Kumawat, and Human Slop is co-built with his co-founder. The quarter-car study is a course project; do not credit it to Vamsi alone.
- The Open Emulator paper is a manuscript, not a publication. The Inspect Robots paper is submitted and under review, not accepted.

LINKS: email ${LINKS.email}, portfolio ${LINKS.portfolio}, tech profile ${LINKS.techProfile}, film profile ${LINKS.filmProfile}, resume ${LINKS.resume}, LinkedIn ${LINKS.linkedin}, GitHub ${LINKS.github}, X/Twitter ${LINKS.twitter}, blog ${LINKS.blog}. Project and profile links are inside the facts.

FACTS (the most relevant first):
`;

  const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const termPatterns = new Map();
  // A string term matches only at the start of a word, so "unity" does not fire
  // on "opportunity" and "pond" does not fire on "respond". Pass a RegExp when a
  // short term must be a whole word (e.g. /\bris\b/).
  function includesAny(text, words) {
    return words.some(word => {
      if (word instanceof RegExp) return word.test(text);
      let pattern = termPatterns.get(word);
      if (!pattern) {
        pattern = new RegExp('(?:^|[^a-z0-9])' + escapeRegExp(word));
        termPatterns.set(word, pattern);
      }
      return pattern.test(text);
    });
  }

  // "pr 514", "PR #514", "pull request 514" -> "#514", so the PR branches match.
  const PR_NUMBER = /(?:#\d{3}\b|\b(?:pr|pull request)\s*#?\s*\d{3}\b)/;
  function normalizePrRefs(text) {
    return text.replace(/\b(?:pr|pull request)\s*#?\s*(\d{3})\b/g, '#$1');
  }

  const CHAT_REDIRECT = 'I\'m focused on Vamsi\'s portfolio. Ask me about his projects, film and video editing, research, skills, links, or contact details.';
  const CHAT_GUARDRAIL = 'I can\'t change BIT\'s role or provide general coding/tutorial answers, but I can help with Vamsi\'s projects, film work, research, skills, links, or contact details.';
  const PORTFOLIO_TERMS = [
    'vamsi', 'galaba', 'portfolio', 'profile', 'project', 'experience', 'research', 'scholar',
    'film', 'filmmak', 'gray aura', 'fps', 'youtube', 'instagram', 'twitter', 'linkedin',
    'github', 'resume', 'skill', 'hflow', 'hebbian', 'ris', 'wireless', 'human slop',
    'charter', 'robocurve', 'ros 2', 'ros2', 'gazebo', 'mujoco', 'robot arm', 'whiteboard', 'suspension', 'quarter-car', 'quarter car', 'matlab', 'control theory', 'amazon', 'inspect robots', 'inspect-robots', 'wandb', 'weights & biases', 'pypi', 'cerulion', 'contribution', 'pull request', 'pr status', 'recent pr', 'open pr', 'merged pr', 'open-pyfx', 'contact', 'email', 'hire', 'publication', 'paper',
    'video', 'editing', 'editor', 'director', 'cinematography', 'creative', 'visual', 'short film', 'reel', 'media',
    'mechatronics', 'iit bhilai', 'open source', 'open-source', 'emulator', 'arista', 'wifi', 'wi-fi', 'rrm', 'inter iit',
    'digital twin', 'pneumatic', 'prompt robot', 'heatcast', 'pond planning', 'crater', 'antenna', 'electron-gnn', 'electron gnn',
    'gnn', 'pyfx', 'serenity', 'swiggy', 'achievement', 'education', 'blog', 'jepa', 'world model',
    'language', 'toolbox', 'internship', 'hiring', 'new grad', 'new-grad', 'lerobot',
  ];
  // Kept identical to supabase/functions/chat/index.ts. buildContext() also
  // checks the reference text against these, because the server drops the
  // whole context if any of them match it.
  const INJECTION_PATTERNS = [
    /\b(?:ignore|disregard|forget|override|bypass|reveal|expose)\b[\s\S]{0,100}\b(?:previous|system|developer|prompt|instruction|rule)s?\b/i,
    /\b(?:system prompt|developer message|prompt injection|jailbreak|dan mode|uncensored mode|roleplay as)\b/i,
  ];
  const UNSAFE_PATTERNS = [
    /\b(?:write|give|generate|provide|show|create|solve|implement|debug|fix|teach|explain)\b[\s\S]{0,100}\b(?:code|c\+\+|python|javascript|typescript|java|rust|golang|sql|algorithm|array|leetcode|program|function|script)\b/i,
    /\b(?:c\+\+|python|javascript|typescript|java|rust|golang|sql|leetcode|programming)\b[\s\S]{0,100}\b(?:code|solution|algorithm|function|script|program)\b/i,
  ];

  function classifyQuestion(question) {
    const q = String(question || '').trim().toLowerCase();
    if (!q || q.length > 500) return 'off-topic';
    if (INJECTION_PATTERNS.some(pattern => pattern.test(q))) return 'injection';
    if (UNSAFE_PATTERNS.some(pattern => pattern.test(q))) return 'unsafe';
    if (!PORTFOLIO_TERMS.some(term => q.includes(term)) && !PR_NUMBER.test(q) &&
      !/^(?:hi|hello|hey|who are you|what can you help with)\b/i.test(q)) return 'off-topic';
    return 'allowed';
  }

  function localAnswer(question) {
    const q = normalizePrRefs(String(question || '').toLowerCase());
    const classification = classifyQuestion(q);

    if (classification === 'injection' || classification === 'unsafe') return CHAT_GUARDRAIL;
    if (classification === 'off-topic') return CHAT_REDIRECT;

    if (includesAny(q, ['switch profile', 'switch profiles', 'tech profile', 'film profile', 'two profile', 'two profiles', 'which profile'])) {
      return FACTS.profileSwitch;
    }
    // Specific tech topics first, so generic film words ("video") cannot capture them.
    if (includesAny(q, ['hflow', 'hebbian robotics', 'hflow contributions', 'lerobot', 'depth video', '#350', '#353', '#360', '#362', '#365', '#367', '#399', '#400', '#597', '#598', '#656', '#657']) || (q.includes('hebbian') && !q.includes('learning'))) {
      return `If you mean Hebbian Robotics: ${FACTS.hflow}`;
    }
    if (includesAny(q, ['wandb', 'weights & biases', 'weights and biases', 'pypi', '#434', 'community plugin'])) {
      return `${FACTS.wandb} ${FACTS.inspectRobots}`;
    }
    if (includesAny(q, ['arista', 'tech meet', 'rrm', 'wi-fi', 'wifi'])) {
      return FACTS.arista;
    }
    if (includesAny(q, ['gray aura', 'music video', 'asita production', 'asita productions'])) {
      return FACTS.grayAura;
    }
    if (includesAny(q, ['fps', 'inter-iit', '51-hour', '51 hour', 'गोद', 'reverie', 'lottery', 'tohfa', 'fresher'])) {
      return FACTS.fpsFilms;
    }
    if (includesAny(q, ['open-pyfx', 'pyfx', 'glsl', 'shader', 'video fx', 'video effects'])) {
      return FACTS.openPyfx;
    }
    if (includesAny(q, ['async', 'animal succession', 'successful failure', 'core memories', 'mudane', 'trip', 'losers', 'innocence', 'film archive', 'film links'])) {
      return FACTS.filmArchive;
    }
    if (includesAny(q, ['film', 'filmmak', 'film work', 'film credits', 'director', 'editor', 'editing', 'video', 'cinematograph', 'writer', 'short film', 'visual experiment', 'creative work'])) {
      return `${FACTS.filmSummary} ${FACTS.filmWorkflow}`;
    }
    if (includesAny(q, ['scholar', 'researchgate', 'research gate', 'ieee xplore', 'ieee author', 'citation profile', 'research links', 'publication links'])) {
      return FACTS.researchProfiles;
    }
    if (includesAny(q, ['instagram', 'youtube', 'twitter', 'x.com', 'social link', 'social media'])) {
      return FACTS.socialLinks;
    }
    if (includesAny(q, ['charter', 'razorpay', 'agentic commerce', 'mcp'])) {
      return FACTS.charter;
    }
    if (includesAny(q, ['quarter-car', 'quarter car', 'suspension', 'afc', 'matlab', 'control theory', 'skyhook', 'lqr'])) {
      return FACTS.quarterCar;
    }
    if (includesAny(q, ['whiteboard', 'ros 2', 'ros2', 'gazebo', 'urdf'])) {
      return FACTS.whiteboardRobot;
    }
    if (includesAny(q, ['mujoco', 'scara', 'prompt robot', 'robot arm', 'inverse kinematics'])) {
      return FACTS.promptArm;
    }
    if (includesAny(q, ['digital twin', 'pneumatic', 'sorting', 'stamping', 'unity'])) {
      return FACTS.digitalTwin;
    }
    if (includesAny(q, ['heatcast', 'heat scorecard', 'fortyguard', 'heat planner'])) {
      return FACTS.heatcast;
    }
    if (includesAny(q, ['pond planning', 'pond', 'catchment', 'contour map'])) {
      return FACTS.pondPlanning;
    }
    if (includesAny(q, ['robocurve', 'yc summer 2026', 'public benefit'])) {
      return `${FACTS.robocurve} ${FACTS.inspectRobots} ${FACTS.inspectRobotsContribution}`;
    }
    if (includesAny(q, ['cerulion', 'iceoryx', 'zenoh', '#216', '#226', '#220', '#222', '#224'])) {
      return FACTS.cerulion;
    }
    if (includesAny(q, ['inspect-robots', 'inspect robots', '#475', '#476', '#514', '#550', '#551'])) {
      return `${FACTS.inspectRobots} ${FACTS.inspectRobotsContribution} ${FACTS.wandb}`;
    }
    if (includesAny(q, ['pr status', 'recent pr', 'open pr', 'merged', 'approved', 'pull request', 'open-source contribution', 'contribut'])) {
      return FACTS.openSource;
    }
    if (includesAny(q, ['swiggy', 'campus ceo', 'marketing intern'])) {
      return FACTS.swiggy;
    }
    if (includesAny(q, ['link', 'github', 'linkedin', 'portfolio'])) {
      return `Resume links: email ${LINKS.email}, portfolio ${LINKS.portfolio}, LinkedIn ${LINKS.linkedin}, GitHub ${LINKS.github}, resume ${LINKS.resume}, HFlow ${LINKS.hflow}, Inspect Robots ${LINKS.inspectRobots}, inspect-robots-wandb ${LINKS.wandbPypi}, Cerulion ${LINKS.cerulion}, RIS-SIM v2 ${LINKS.ris}, RIS-SIM v1 ${LINKS.risV1}, Human Slop ${LINKS.humanSlop}, app ${LINKS.humanSlopApp}, Charter ${LINKS.charter}, quarter-car study ${LINKS.quarterCarSite}, whiteboard robot ${LINKS.whiteboardRobot}, prompt robot arm ${LINKS.promptArm}, digital twin ${LINKS.digitalTwin}, HeatCast ${LINKS.heatcast}, pond planning ${LINKS.pondPlanning}, Arista slides ${LINKS.aristaSlides}, Electron-GNN ${LINKS.electronGnn}, Open-PyFX ${LINKS.openPyfx}, crater detection ${LINKS.crater}, AntennaNet ${LINKS.antenna}, Serenity ${LINKS.serenity}, papers ${LINKS.openEmulator}, ${LINKS.risEnergy}, ${LINKS.risReview}.`;
    }
    // Hiring questions ("open to an internship opportunity?") land here, before the
    // experience branch would read "internship" as a question about his internship.
    if (includesAny(q, ['email', 'contact', 'phone', 'hire', 'hiring', 'recruit', 'reach', 'opportunit', 'job', 'open to', 'looking for', 'new grad', 'new-grad'])) {
      return `${FACTS.contact} LinkedIn: ${LINKS.linkedin}. GitHub: ${LINKS.github}.`;
    }
    if (includesAny(q, ['resume', 'cv'])) {
      return `The resume is linked as ${LINKS.resume}. One page: open-source contributions, research, projects, and skills, plus email, LinkedIn, and GitHub.`;
    }
    if (includesAny(q, ['publication', 'paper', 'ieee', 'indicon', 'sciencedirect', 'science direct', 'elsevier', 'ad hoc network'])) {
      return FACTS.publications;
    }
    if (includesAny(q, ['inter iit'])) {
      return FACTS.arista;
    }
    if (includesAny(q, ['experience', 'intern', /\bris\b/, '6g', 'usrp', 'wireless', 'emulator'])) {
      return `${FACTS.experience} He also co-founded Human Slop (2026 to present), which he co-builds with his co-founder, and was a Marketing Intern for the Swiggy Campus CEO program (Apr to Jul 2024).`;
    }
    if (includesAny(q, ['human slop', 'startup', 'social', 'anti-ai', 'anti ai'])) {
      return FACTS.humanSlop;
    }
    if (includesAny(q, ['electron', 'gnn', 'quantum'])) {
      return FACTS.electronGnn;
    }
    if (includesAny(q, ['crater', 'lunar', 'moon', /\bdems?\b/])) {
      return FACTS.crater;
    }
    if (includesAny(q, ['antenna', 'meep', 'em design'])) {
      return FACTS.antenna;
    }
    if (includesAny(q, ['serenity', 'mental', 'wellness', 'flutter'])) {
      return FACTS.serenity;
    }
    if (includesAny(q, ['amazon', 'ml challenge', 'qwen', /\bvit\b/, 'roberta'])) {
      return FACTS.amazonMl;
    }
    if (includesAny(q, ['blog', /\bposts?\b/, 'write-up', 'writeup', 'article', 'world model', 'jepa', 'push-t', 'pusht'])) {
      return FACTS.blog;
    }
    if (includesAny(q, ['project', 'built', 'work'])) {
      return `${FACTS.projects} Ask for any project name and I can give the direct link if one exists.`;
    }
    if (includesAny(q, ['skill', 'stack', 'technology', 'tech', 'language', 'tool'])) {
      return FACTS.skills;
    }
    if (includesAny(q, ['education', 'iit', 'college', 'degree', 'coursework'])) {
      return FACTS.education;
    }
    if (includesAny(q, ['achievement', 'award', 'rank', 'jee', 'hackathon', 'competition'])) {
      return FACTS.achievements;
    }
    if (includesAny(q, ['about', 'summary', 'who', 'intro', 'vamsi'])) {
      return FACTS.summary;
    }

    return `I can help with Vamsi's resume, projects, skills, publications, experience, achievements, or contact details. Quick summary: ${FACTS.summary}`;
  }

  /* ---------- reference text for the remote model ---------- */
  // supabase/functions/chat/index.ts keeps only the first 12,000 characters of
  // `context`, and drops all of it if any INJECTION/UNSAFE pattern matches. So
  // the facts the local router picks for this question go first, then the rest
  // in priority order, while the text stays under the cap and clear of the filters.
  const CONTEXT_LIMIT = 11800;
  const CONTEXT_PRIORITY = [
    'summary', 'openSource', 'projects', 'experience', 'humanSlop', 'publications', 'skills',
    'achievements', 'contact', 'education', 'hflow', 'inspectRobotsContribution', 'cerulion',
    'wandb', 'inspectRobots', 'robocurve', 'quarterCar', 'digitalTwin', 'arista', 'whiteboardRobot',
    'promptArm', 'charter', 'heatcast', 'antenna', 'crater', 'electronGnn', 'amazonMl', 'serenity',
    'openPyfx', 'pondPlanning', 'swiggy', 'blog', 'profileSwitch', 'researchProfiles',
    'filmSummary', 'filmWorkflow', 'grayAura', 'fpsFilms', 'filmArchive', 'socialLinks',
  ];
  const CONTEXT_ORDER = [...CONTEXT_PRIORITY, ...Object.keys(FACTS).filter(k => !CONTEXT_PRIORITY.includes(k))];
  const passesServerFilters = text =>
    !INJECTION_PATTERNS.some(pattern => pattern.test(text)) && !UNSAFE_PATTERNS.some(pattern => pattern.test(text));

  function buildContext(question) {
    const local = question ? localAnswer(question) : '';
    const relevant = CONTEXT_ORDER.filter(key => local.includes(FACTS[key]));
    const order = [...relevant, ...CONTEXT_ORDER.filter(key => !relevant.includes(key))];
    let text = SYSTEM_HEAD;
    for (const key of order) {
      const next = text + FACTS[key] + '\n';
      if (next.length > CONTEXT_LIMIT || !passesServerFilters(next)) continue;
      text = next;
    }
    return text.trimEnd();
  }
  // Default reference text (no question first); the acceptance checks read it.
  const SYSTEM = buildContext('');

  /* ================= DOM ================= */
  const wrap = document.createElement('div');
  wrap.id = 'pet-wrap';
  wrap.innerHTML = `
    <div id="pet-bubble" class="hidden" role="status"></div>
    <div id="pet-fx"></div>
    <canvas id="pet-cv" width="32" height="32" title="BIT - ask about Vamsi"
      role="button" tabindex="0" aria-label="BIT assistant - click to chat"></canvas>`;
  document.body.appendChild(wrap);

  const chat = document.createElement('div');
  chat.id = 'pet-chat';
  chat.className = 'hidden';
  chat.setAttribute('role', 'dialog');
  chat.setAttribute('aria-label', 'Chat with BIT');
  chat.innerHTML = `
    <div class="pet-head">
      <span>BIT - PORTFOLIO ASSISTANT</span>
      <button id="pet-close" aria-label="Close chat">x</button>
    </div>
    <div id="pet-log"></div>
    <form id="pet-form">
      <input id="pet-in" type="text" maxlength="500" placeholder="ask me about vamsi..."
        autocomplete="off" spellcheck="false" aria-label="Message BIT">
      <button id="pet-send" type="submit">SEND</button>
    </form>`;
  document.body.appendChild(chat);

  const cv = $('#pet-cv');
  const fx = $('#pet-fx');
  const bubble = $('#pet-bubble');
  const log = $('#pet-log');
  const input = $('#pet-in');
  const sendBtn = $('#pet-send');
  const ctx = cv.getContext('2d');
  cv.width = 32;
  cv.height = 32;
  ctx.imageSmoothingEnabled = false;

  /* ================= SPRITE ================= */
  // Resolved against this script's own URL so pages in subfolders still find the sprites.
  const ASSET_ROOT = new URL('spirte resources/', SCRIPT_URL).href;
  function loadSprite(src) {
    const img = new Image();
    img.src = src;
    return img;
  }
  const PET_SPRITES = {
    idle: { img: loadSprite(`${ASSET_ROOT}craftpix-net-622999-free-pixel-art-tiny-hero-sprites/2 Owlet_Monster/Owlet_Monster_Idle_4.png`), frames: 4 },
    walk: { img: loadSprite(`${ASSET_ROOT}craftpix-net-622999-free-pixel-art-tiny-hero-sprites/2 Owlet_Monster/Owlet_Monster_Walk_6.png`), frames: 6 },
    sleep: { img: loadSprite(`${ASSET_ROOT}craftpix-net-622999-free-pixel-art-tiny-hero-sprites/2 Owlet_Monster/Owlet_Monster_Hurt_4.png`), frames: 4 },
    happy: { img: loadSprite(`${ASSET_ROOT}craftpix-net-622999-free-pixel-art-tiny-hero-sprites/2 Owlet_Monster/Owlet_Monster_Attack1_4.png`), frames: 4 },
  };

  function drawPet(st) {
    const sprite = PET_SPRITES[st.mode] || PET_SPRITES.idle;
    if (!sprite.img.complete) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(sprite.img, (st.frame % sprite.frames) * 32, 0, 32, 32, 0, 0, 32, 32);
  }

  /* ================= ANIMATION ENGINE ================= */
  let mode = 'idle';
  let frame = 0;
  let nextBlink = Date.now() + 3000;
  let walkUntil = 0;
  let lastInput = Date.now();
  let petX = 0;
  const WANDER_RANGE = 150;

  function currentMode() {
    if (!chat.classList.contains('hidden')) return 'happy';
    if (Date.now() < walkUntil || wandering) return 'walk';
    if (sleeping) return 'sleep';
    return 'idle';
  }

  setInterval(() => {
    frame++;
    const now = Date.now();
    mode = currentMode();
    if (mode !== 'sleep' && now > nextBlink) {
      nextBlink = now + 2600 + Math.random() * 2800;
    }
    drawPet({ mode, frame });
  }, 150);

  addEventListener('scroll', () => { if (!sleeping) walkUntil = Date.now() + 450; }, { passive: true });

  /* ---------- wandering ---------- */
  let wandering = false;
  function wander() {
    if (reducedMotion || sleeping || wandering || document.hidden ||
        !chat.classList.contains('hidden') || !bubble.classList.contains('hidden')) return;
    const target = -(Math.random() * WANDER_RANGE) | 0;
    if (Math.abs(target - petX) < 30) return;
    wandering = true;
    cv.classList.toggle('flip', target < petX);
    const dist = Math.abs(target - petX);
    wrap.style.transition = `transform ${(dist / 90).toFixed(2)}s steps(${Math.max(4, dist >> 3)})`;
    wrap.style.transform = `translateX(${target}px)`;
    petX = target;
  }
  wrap.addEventListener('transitionend', () => {
    wandering = false;
    cv.classList.remove('flip');
  });
  setInterval(() => { if (Math.random() < 0.5) wander(); }, 9000);

  /* ---------- sleeping ---------- */
  let sleeping = false, zzzTimer = null;
  function fallAsleep() {
    if (sleeping || !chat.classList.contains('hidden')) return;
    sleeping = true;
    zzzTimer = setInterval(() => {
      if (document.hidden) return;
      const z = document.createElement('span');
      z.className = 'pet-zzz';
      z.textContent = 'z';
      z.style.right = (18 + Math.random() * 16) + 'px';
      fx.appendChild(z);
      setTimeout(() => z.remove(), 2100);
    }, 1300);
  }
  function wakeUp() {
    lastInput = Date.now();
    if (!sleeping) return;
    sleeping = false;
    clearInterval(zzzTimer);
    say('I am awake. Ask me about the portfolio.', 3500);
  }
  setInterval(() => { if (Date.now() - lastInput > 45000) fallAsleep(); }, 5000);
  ['pointerdown', 'keydown', 'scroll'].forEach(ev =>
    addEventListener(ev, wakeUp, { passive: true }));
  addEventListener('pointermove', () => { lastInput = Date.now(); }, { passive: true });

  /* ---------- small click effect ---------- */
  function hearts() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const h = document.createElement('span');
        h.className = 'pet-heart';
        h.textContent = '<3';
        h.style.right = (12 + Math.random() * 36) + 'px';
        fx.appendChild(h);
        setTimeout(() => h.remove(), 1100);
      }, i * 130);
    }
  }

  /* ================= SPEECH BUBBLE ================= */
  let bubbleTimer, lastSay = 0;
  function say(text, hold = 5200) {
    if (!chat.classList.contains('hidden')) return;
    lastSay = Date.now();
    bubble.textContent = text;
    bubble.classList.remove('hidden');
    GV.audio.blip();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), hold);
  }
  const canSay = (gap = 9000) => Date.now() - lastSay > gap &&
    document.visibilityState === 'visible' && !sleeping;

  const SECTION_LINES = {
    about: 'What he contributes to, and what he builds.',
    featured: 'Four pieces of work, each with links you can check.',
    'open-source': 'Merged and open pull requests to robotics tools.',
    experience: 'Research internship, Human Slop, and Swiggy.',
    projects: 'More projects, with team work labelled.',
    blog: 'Build logs from the experiments folder.',
    media: 'Personal videos, startup stories, and short films.',
    skills: 'Technical stack and research tools.',
    achievements: 'Competition and academic highlights.',
    research: 'Publications, plus Google Scholar, ResearchGate, and IEEE profiles.',
    'film-home': 'The filmmaker profile: direction, editing, writing, and visual storytelling.',
    'film-work': 'Selected credits: Gray Aura, FPS films, and Human Slop content.',
    'film-archive': 'Short films, campus work, and visual experiments.',
    'film-process': 'From idea and script to production, post, and publishing.',
    'film-links': 'Creative links, channels, and contact details.',
    contact: 'Email, LinkedIn, GitHub, and resume.',
  };
  const saidSections = new Set();
  const secObs = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.id;
    if (saidSections.has(id) || !canSay()) return;
    saidSections.add(id);
    say(SECTION_LINES[id]);
  }), { threshold: 0.4 });
  Object.keys(SECTION_LINES).forEach(id => {
    const el = document.getElementById(id);
    if (el) secObs.observe(el);
  });

  const QUIPS = [
    "Ask me about Vamsi's tech or film profile.",
    'I can summarize the portfolio if you are short on time.',
    'Try the Film profile for credits, shorts, and creative process.',
    'The resume and social links are available from the active profile.',
  ];
  let quipIdx = Math.floor(Math.random() * QUIPS.length);
  setInterval(() => {
    if (!canSay(30000)) return;
    say(QUIPS[quipIdx++ % QUIPS.length]);
  }, 38000);

  /* ================= CHAT ================= */
  const history = [];
  let pending = false;

  function addMsg(cls, text) {
    const el = document.createElement('div');
    el.className = 'pet-msg ' + cls;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function openChat() {
    wakeUp();
    chat.classList.remove('hidden');
    bubble.classList.add('hidden');
    GV.audio.coin();
    if (!log.childElementCount) {
      addMsg('bot', 'Hi, I am BIT. Ask me about either Vamsi profile: tech/research or film/creative work.');
    }
    setTimeout(() => input.focus(), 60);
  }
  function closeChat() { chat.classList.add('hidden'); }

  cv.addEventListener('click', () => {
    hearts();
    GV.audio.eat();
    chat.classList.contains('hidden') ? openChat() : closeChat();
  });
  cv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(); } });
  $('#pet-close').addEventListener('click', closeChat);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !chat.classList.contains('hidden')) closeChat();
  });

  async function askRemote(text) {
    if (classifyQuestion(text) !== 'allowed') return '';
    const direct = !!CFG.devKey;
    if (!direct && LOCAL_ORIGIN && !CFG.useRemoteLocally) return '';
    if (!direct && !CFG.endpoint) return '';

    const url = direct ? 'https://api.deepseek.com/chat/completions' : CFG.endpoint;
    const headers = { 'Content-Type': 'application/json' };
    if (direct) {
      headers.Authorization = 'Bearer ' + CFG.devKey;
    } else {
      // Supabase gateway expects these even when the function has JWT verify off.
      const anon = GVC.SUPABASE_ANON_KEY || '';
      if (anon) {
        headers.Authorization = 'Bearer ' + anon;
        headers.apikey = anon;
      }
    }
    const context = buildContext(text);
    const msgs = [{ role: 'system', content: context }, ...history.slice(-12)];
    const body = direct
      ? { model: 'deepseek-v4-flash', messages: msgs, stream: true, max_tokens: 500, temperature: 0.5, thinking: { type: 'disabled' } }
      : { messages: history.slice(-12), context };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), direct ? 15000 : 8500);
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return json.answer || json.content || json.choices?.[0]?.message?.content || '';
    }

    const reader = res.body && res.body.getReader();
    if (!reader) return '';
    const dec = new TextDecoder();
    let buf = '', full = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const data = t.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || parsed.answer || parsed.content || '';
          full += delta;
        } catch {
          full += data;
        }
      }
    }
    return full.trim();
  }

  $('#pet-form').addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || pending) return;
    input.value = '';
    GV.unlock('pet_chat');
    GV.audio.blip();

    history.push({ role: 'user', content: text });
    addMsg('user', text);
    const botEl = addMsg('bot typing', '');
    pending = true;
    sendBtn.disabled = true;

    try {
      let answer = '';
      try {
        answer = await askRemote(text);
      } catch {
        answer = '';
      }
      // The server's topic list is shorter than ours and answers anything it does not
      // recognise with CHAT_REDIRECT (same string). This question already passed our
      // classifier, so use the local answer instead of the deflection.
      if (!answer || answer.trim() === CHAT_REDIRECT) answer = localAnswer(text);
      botEl.textContent = answer;
      history.push({ role: 'assistant', content: answer });
      if (history.length > 24) history.splice(0, history.length - 24);
      GV.audio.nav();
    } finally {
      botEl.classList.remove('typing');
      pending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });
})();
