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
    ris: 'https://github.com/Galabavamsi/RIS-SIM',
    hflow: 'https://github.com/Hebbian-Robotics/hflow',
    hflowContributions: 'https://github.com/Hebbian-Robotics/hflow/pulls?q=is%3Apr+state%3Aclosed+author%3AGalabavamsi',
    hflowPr350: 'https://github.com/Hebbian-Robotics/hflow/pull/350',
    hflowPr353: 'https://github.com/Hebbian-Robotics/hflow/pull/353',
    hflowPr360: 'https://github.com/Hebbian-Robotics/hflow/pull/360',
    hflowPr362: 'https://github.com/Hebbian-Robotics/hflow/pull/362',
    hflowPr367: 'https://github.com/Hebbian-Robotics/hflow/pull/367',
    hflowPr400: 'https://github.com/Hebbian-Robotics/hflow/pull/400',
    hflowPr598: 'https://github.com/Hebbian-Robotics/hflow/pull/598',
    hflowIssue597: 'https://github.com/Hebbian-Robotics/hflow/issues/597',
    hflowIssue365: 'https://github.com/Hebbian-Robotics/hflow/issues/365',
    hflowIssue399: 'https://github.com/Hebbian-Robotics/hflow/issues/399',
    robocurve: 'https://robocurve.org/',
    robocurveYc: 'https://www.ycombinator.com/companies/robocurve',
    inspectRobots: 'https://github.com/robocurve/inspect-robots',
    inspectRobotsContributions: 'https://github.com/robocurve/inspect-robots/pulls?q=is%3Apr+state%3Aopen+author%3AGalabavamsi',
    inspectRobotsPr476: 'https://github.com/robocurve/inspect-robots/pull/476',
    inspectRobotsPr475: 'https://github.com/robocurve/inspect-robots/pull/475',
    inspectRobotsPr434: 'https://github.com/robocurve/inspect-robots/pull/434',
    humanSlop: 'https://humanslop.in/',
    humanSlopApp: 'https://play.google.com/store/apps/details?id=com.humanslop.app',
    humanSlopGithub: 'https://github.com/Galabavamsi/human-slop',
    aristaSlides: 'https://canva.link/puoqbe4okoid8rb',
    electronGnn: 'https://github.com/Galabavamsi/Electron-GNN',
    openPyfx: 'https://github.com/Galabavamsi/open-pyfx',
    crater: 'https://github.com/Galabavamsi/Moon-Crater-Detection-using-DEM',
    antenna: 'https://github.com/Galabavamsi/Antenna-Net',
    serenity: 'https://github.com/Galabavamsi/Serenity',
    charter: 'https://github.com/Galabavamsi/charter',
    charterEvaluator: 'https://core-api-production-087b.up.railway.app',
    digitalTwin: 'https://github.com/Galabavamsi/pneumatic-sorting-digital-twin',
    heatcast: 'https://github.com/Galabavamsi/heatcast',
    heatcastDemo: 'https://web-pearl-ten-99.vercel.app',
    pondPlanning: 'https://github.com/Galabavamsi/ai-village-pond-planning',
    blog: 'https://galabavamsi.github.io/portfolio/blog/',
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
    summary: 'Galaba Vamsi is a B.Tech Mechatronics student at IIT Bhilai, graduating in May 2027. He has two portfolio profiles: a tech profile for software engineering, AI/ML, computer vision, wireless systems, GPU systems, and research; and a film profile for filmmaking, editing, directing, writing, cinematography, and visual experiments. Switch between them with the Tech and Film buttons in the header.',
    filmSummary: 'Vamsi is a filmmaker, editor, director, writer, and Mechatronics student at IIT Bhilai. He works across narrative short films, music videos, campus films, startup/product content, social-first reels, video essays, and visual experiments. His technical background in AI/ML, computer vision, robotics, GPU systems, and full-stack software helps him work across both the creative and technical sides of production.',
    filmWorkflow: 'Vamsi can take a project from idea to script, shot planning, direction, camera/production, edit, sound and visual polish, and final publishing. His strongest creative combination is filmmaking and visual storytelling, writing and directing, editing and post-production, social-first instincts, technical fluency, and fast production under difficult constraints.',
    grayAura: 'Gray Aura is an official music video for Godchild and Thrsdae, produced by Asita Production. Vamsi directed it with Harshal Singh, contributed cinematography with Harshal Singh and Aditya Singh, and edited it. Video: ' + LINKS.grayAura + '. Asita Productions: ' + LINKS.asita + '.',
    fpsFilms: 'Vamsi worked with FPS — IIT Bhilai as a director, editor, and writer. The team made films under the Inter-IIT 51-hour format, developing, shooting, and editing complete films under extreme time constraints. Key films include गोद (' + LINKS.god + '), REVERIE (' + LINKS.reverie + '), Lottery (' + LINKS.lottery + '), TOHFA (' + LINKS.tohfa + '), and Fresher\'s Introduction 2024 (' + LINKS.fresherIntro + '). FPS channel: ' + LINKS.fpsChannel + '.',
    filmArchive: 'Personal film and video work includes Animal Succession edit (' + LINKS.animalSuccession + '), ASYNC — a Backrooms lore short film made in approximately four hours (' + LINKS.asyncFilm + '), A Successful Failure (' + LINKS.successfulFailure + '), Core Memories (' + LINKS.coreMemories + '), MUDANE — a Sony FX30 experiment (' + LINKS.mudane + '), TRIP — Fuji XT3 (' + LINKS.trip + '), A Journey Through Mind (' + LINKS.journeyMind + '), LOSERS — Fuji XT3 (' + LINKS.losers + '), THE END — Fuji XT3 (' + LINKS.theEnd + '), Happy Deepavali (' + LINKS.happyDeepavali + '), PRAYATNA 6.0 versions, RANDOMSHIT, and INNOCENCE. The public collection is on ' + LINKS.youtube + '.',
    socialLinks: 'Creative links: Instagram ' + LINKS.instagram + ', Instagram Reels ' + LINKS.instagramReels + ', personal YouTube ' + LINKS.youtube + ', FPS channel ' + LINKS.fpsChannel + ', X/Twitter ' + LINKS.twitter + ', and Asita Productions ' + LINKS.asita + '.',
    researchProfiles: 'Research profiles: Google Scholar ' + LINKS.scholar + ', ResearchGate ' + LINKS.researchgate + ', and IEEE Xplore author profile ' + LINKS.ieeeAuthor + '.',
    profileSwitch: 'The portfolio has separate Tech and Film profiles. Tech covers software engineering, AI/ML, projects, experience, publications, and skills. Film covers direction, writing, editing, cinematography, music videos, campus films, startup content, and visual experiments. Use the Tech and Film buttons in the header, or open ' + LINKS.filmProfile + ' for the film profile.',
    experience: 'Research Intern at IIT Bhilai from May to Aug 2025 under Dr. Arzad Alam. He built an open-source 6G RIS simulator, emulated USRP workflows for LoS/NLoS environments, reduced hardware costs, and designed a two-layer RIS PCB workflow for RF energy harvesting research.',
    swiggy: 'Vamsi was a Marketing Intern at Swiggy Ltd for the Campus CEO project from May to July 2024. He managed a campaign with 15 social media posts and contributed to campus marketing initiatives and execution.',
    hflow: 'Hebbian Robotics (YC S26) is the organization behind HFlow, an open-source robotics data processing and evaluation framework. In 2026, Vamsi contributed 7 maintainer-reviewed and merged pull requests: #350, #353, #360, #362, #367, #400, and #598. PR #598 resolved HFlow issue #597 by refusing sources with multiple channels on one topic before canonical episode creation, adding doctor diagnostics, and bumping TRANSFORM_BEHAVIOR_VERSION to 10. PR #400 resolved issue #399 by refusing LeRobot depth videos before conversion when depth markers are present, preserving the existing RGB path and preventing loss of 12-bit depth semantics. PR #367 resolved issue #365 by adding a reproducible cold camera_frame_stats evidence benchmark covering 3 cold 1080p30 checks with 900 decoded frames each and a 4.897 s median; it separated transform timing and provenance and documented that no repeatable semantics-preserving speedup was demonstrated, without changing the shipped filter graph. HFlow: ' + LINKS.hflow + '. Contributions: ' + LINKS.hflowContributions + '. PRs: ' + LINKS.hflowPr350 + ', ' + LINKS.hflowPr353 + ', ' + LINKS.hflowPr360 + ', ' + LINKS.hflowPr362 + ', ' + LINKS.hflowPr367 + ', ' + LINKS.hflowPr400 + ', ' + LINKS.hflowPr598 + '. Issues: ' + LINKS.hflowIssue365 + ', ' + LINKS.hflowIssue399 + ', ' + LINKS.hflowIssue597 + '.',
    robocurve: 'Robocurve is an active YC Summer 2026 company in San Francisco and a Public Benefit Corporation building open-source tools and independent benchmarks for physical AI. Website: ' + LINKS.robocurve + '. YC: ' + LINKS.robocurveYc + '.',
    inspectRobots: 'Inspect Robots is Robocurve\'s MIT-licensed open-source evaluation framework for physical AI. It runs policies on real or simulated embodiments with auditable logs and Rerun visualization. Repository: ' + LINKS.inspectRobots + '.',
    inspectRobotsContribution: 'Vamsi has 2 merged and 1 open pull request on Inspect Robots. PR #476 is merged and exposes configurable retry policy across agent integrations while honoring valid Retry-After headers: ' + LINKS.inspectRobotsPr476 + '. PR #475 is also merged and preserves unknown git provenance when working-tree status cannot be verified: ' + LINKS.inspectRobotsPr475 + '. PR #434 remains open and adds a first-party inspect-robots-wandb plugin with a WandbSink for recording evaluation configuration and final aggregate metrics per evaluation: ' + LINKS.inspectRobotsPr434 + '. Open contributions: ' + LINKS.inspectRobotsContributions + '.',
    humanSlop: 'Human Slop is an anti-AI social platform Vamsi co-founded in 2026 and continues to build. It uses React, PostgreSQL, AWS, hardware-bound biometric authentication, and real-time typing forensics to defend against synthetic content.',
    arista: 'For the Arista Networks Wi-Fi Optimization challenge at Inter IIT Tech Meet 14.0, Vamsi built a client-aware Wi-Fi RRM system in NS-3 using 3 RF metrics, 5 ms / 100,000-sample I/Q captures, 16-class Dual-CNN inference, and a 5-AP / 50-client topology with IEEE 802.11k/v. The team ranked 5th. Slides: ' + LINKS.aristaSlides,
    charter: 'Charter is an agentic commerce prototype for the Razorpay AI Buildathon Track 01. Chat, voice, and MCP share a bounded commerce core with frozen Razorpay test-mode quotes, audit trails, and fail-closed payment handling. GitHub: ' + LINKS.charter + '. Evaluator: ' + LINKS.charterEvaluator + '.',
    digitalTwin: 'The Pneumatic Sorting Digital Twin is an open-source Unity workspace for modular electropneumatic automation. It covers offline sorting and stamping kits with simulated axes, HMI flows, telemetry, and replay. GitHub: ' + LINKS.digitalTwin + '.',
    heatcast: 'HeatCast is a neighborhood heat-planning scorecard for US planners combining FortyGuard thermal maps, heat exceedance and streak analysis, vulnerability data, indoor sites, walking routes, and planning tools. GitHub: ' + LINKS.heatcast + '. Demo: ' + LINKS.heatcastDemo + '.',
    pondPlanning: 'AI Village Pond Planning is a terrain-only backend API that turns contour maps into pond-site and catchment recommendations using metric projection, elevation-grid interpolation, D8 flow routing, and GeoJSON outputs. GitHub: ' + LINKS.pondPlanning + '.',
    projects: 'Selected projects: Arista Wi-Fi Optimization, Human Slop, Charter, Pneumatic Sorting Digital Twin, HeatCast, AI Village Pond Planning, Electron-GNN, Open-PyFX, Lunar Crater Detection, AntennaNet, Amazon ML Challenge, Serenity, and the RIS simulator. Ask for any project name for its direct link.',
    skills: 'Languages: Python, C/C++, TypeScript, JavaScript, SQL, GLSL, CUDA. AI/ML: PyTorch, GATv2, Safe RL, Transformers, OpenCV, CuPy, NumPy. Software and systems: React, React Native, Flutter, FastAPI, Node.js, REST APIs, WebSockets, PostgreSQL, AWS, Supabase, Docker, ROS 2, Gazebo, MEEP, OpenMPI, SDR/USRP. Developer tools: Git, Linux, GitHub Actions, CI/CD, pytest, Ruff, ty, static analysis, and regression testing.',
    education: 'Education: B.Tech in Mechatronics at IIT Bhilai, Aug 2023 to May 2027. Coursework includes DSA, OOP, deep learning for computer vision, AI/ML, digital image processing, and optimal control.',
    achievements: 'Highlights: 1st place IIT Bhilai Web Development Competition, YC Startup School, 5th rank Inter IIT Tech Meet Arista challenge, top 3.5% Amazon ML Challenge, top 1% JEE Advanced, top 10 Toyota Hackathon, 95% Class 12, and 94% Class 10.',
    publications: 'Publications: first-author An Open Emulator for Smart Radio Environments; co-author Experience with RF Energy Harvesting-Driven Self-Powered RIS at IEEE INDICON 2025; co-author a ScienceDirect review on RIS simulation models and deployments.',
    contact: 'Best contact: galabavamsi12@gmail.com or LinkedIn. Phone from resume: +91 7483047846. He is open to software engineering and AI/ML research roles.',
    blog: 'The blog holds build logs, one post per experiment. The first post covers Physical AI experiment 01: a 1.9M-parameter JEPA world model reproducing the LeWorldModel recipe on Push-T, trained in about 7 minutes on an 8 GB laptop RTX 4070. Training was stable and collapse-free, the latent space encoded agent position without supervision, action ablations confirmed the predictor uses control input, but held-out rollouts drifted after about 2 steps and CEM planning reached 0.000 coverage because the data had almost no goal-directed pushing.',
  };

  const SYSTEM = `You are BIT, a small portfolio assistant on Galaba Vamsi's website.

STYLE RULES:
- Replies under 80 words. Plain text only. No markdown and no emoji.
- Be warm, direct, and easy to understand.
- Be accurate about Vamsi. Never invent facts not listed below.
- The website has separate Tech and Film profiles. Tell visitors to use the Tech/Film switcher when relevant.
- If asked something unrelated to Vamsi or this site, answer briefly, then offer to help with Vamsi's work, projects, skills, or contact details.

ACCURACY NOTES:
- Do not claim Vamsi worked at PinkSauce Studios. He reached the final round for a Filmmaker Intern role; it did not become employment.
- Do not claim a specific role on the Homeie reel unless the user provides confirmation.
- Do not invent a single showreel URL; the YouTube channel and portfolio archive are the public reel collection.
- Treat follower, view, and engagement numbers as dated snapshots, not current metrics.

FACTS:
${Object.values(FACTS).join('\n')}
Links: email ${LINKS.email}, portfolio ${LINKS.portfolio}, tech profile ${LINKS.techProfile}, film profile ${LINKS.filmProfile}, blog ${LINKS.blog}, LinkedIn ${LINKS.linkedin}, GitHub ${LINKS.github}, X/Twitter ${LINKS.twitter}, Instagram ${LINKS.instagram}, personal YouTube ${LINKS.youtube}, FPS channel ${LINKS.fpsChannel}, Google Scholar ${LINKS.scholar}, ResearchGate ${LINKS.researchgate}, IEEE author ${LINKS.ieeeAuthor}, resume ${LINKS.resume}, Gray Aura ${LINKS.grayAura}, Asita Productions ${LINKS.asita}, HFlow ${LINKS.hflow}, HFlow contributions ${LINKS.hflowContributions}, HFlow PRs ${LINKS.hflowPr350}, ${LINKS.hflowPr353}, ${LINKS.hflowPr360}, ${LINKS.hflowPr362}, ${LINKS.hflowPr367}, ${LINKS.hflowPr400}, ${LINKS.hflowPr598}, HFlow issues ${LINKS.hflowIssue365}, ${LINKS.hflowIssue399}, ${LINKS.hflowIssue597}, Robocurve ${LINKS.robocurve}, Robocurve YC ${LINKS.robocurveYc}, inspect-robots ${LINKS.inspectRobots}, inspect-robots contributions ${LINKS.inspectRobotsContributions}, inspect-robots PRs ${LINKS.inspectRobotsPr476}, ${LINKS.inspectRobotsPr475}, ${LINKS.inspectRobotsPr434}, RIS ${LINKS.ris}, Human Slop ${LINKS.humanSlop}, Human Slop app ${LINKS.humanSlopApp}, Human Slop GitHub ${LINKS.humanSlopGithub}, Charter ${LINKS.charter}, Charter evaluator ${LINKS.charterEvaluator}, digital twin ${LINKS.digitalTwin}, HeatCast ${LINKS.heatcast}, HeatCast demo ${LINKS.heatcastDemo}, pond planning ${LINKS.pondPlanning}, Arista slides ${LINKS.aristaSlides}, Electron-GNN ${LINKS.electronGnn}, Open-PyFX ${LINKS.openPyfx}, Lunar Crater Detection ${LINKS.crater}, AntennaNet ${LINKS.antenna}, Serenity ${LINKS.serenity}, publications ${LINKS.openEmulator}, ${LINKS.risEnergy}, ${LINKS.risReview}.`;

  function includesAny(text, words) {
    return words.some(word => text.includes(word));
  }

  const CHAT_REDIRECT = 'I\'m focused on Vamsi\'s portfolio. Ask me about his projects, film and video editing, research, skills, links, or contact details.';
  const CHAT_GUARDRAIL = 'I can\'t change BIT\'s role or provide general coding/tutorial answers, but I can help with Vamsi\'s projects, film work, research, skills, links, or contact details.';
  const PORTFOLIO_TERMS = [
    'vamsi', 'galaba', 'portfolio', 'profile', 'project', 'experience', 'research', 'scholar',
    'film', 'filmmak', 'gray aura', 'fps', 'youtube', 'instagram', 'twitter', 'linkedin',
    'github', 'resume', 'skill', 'hflow', 'hebbian', 'ris', 'wireless', 'human slop',
    'charter', 'robocurve', 'inspect robots', 'inspect-robots', 'contribution', 'pull request', 'open-pyfx', 'contact', 'email', 'hire', 'publication', 'paper',
    'video', 'editing', 'editor', 'director', 'cinematography', 'creative', 'visual', 'short film', 'reel', 'media',
  ];
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
    if (!PORTFOLIO_TERMS.some(term => q.includes(term)) && !/^(?:hi|hello|hey|who are you|what can you help with)\b/i.test(q)) return 'off-topic';
    return 'allowed';
  }

  function localAnswer(question) {
    const q = question.toLowerCase();
    const classification = classifyQuestion(q);

    if (classification === 'injection' || classification === 'unsafe') return CHAT_GUARDRAIL;
    if (classification === 'off-topic') return CHAT_REDIRECT;

    if (includesAny(q, ['switch profile', 'switch profiles', 'tech profile', 'film profile', 'two profile', 'two profiles', 'which profile'])) {
      return FACTS.profileSwitch;
    }
    if (includesAny(q, ['gray aura', 'music video', 'asita production', 'asita productions'])) {
      return FACTS.grayAura;
    }
    if (includesAny(q, ['fps', 'inter-iit', '51-hour', '51 hour', 'गोद', 'reverie', 'lottery', 'tohfa', 'fresher'])) {
      return FACTS.fpsFilms;
    }
    if (includesAny(q, ['film', 'filmmak', 'film work', 'film credits', 'director', 'editor', 'editing', 'video', 'cinematograph', 'writer', 'short film', 'visual experiment', 'creative work'])) {
      return `${FACTS.filmSummary} ${FACTS.filmWorkflow}`;
    }
    if (includesAny(q, ['async', 'animal succession', 'successful failure', 'core memories', 'mudane', 'trip', 'losers', 'innocence', 'film archive', 'film links'])) {
      return FACTS.filmArchive;
    }
    if (includesAny(q, ['scholar', 'researchgate', 'research gate', 'ieee xplore', 'ieee author', 'citation profile', 'research links', 'publication links'])) {
      return FACTS.researchProfiles;
    }
    if (includesAny(q, ['instagram', 'youtube', 'twitter', 'x.com', 'social link', 'social media'])) {
      return FACTS.socialLinks;
    }
    if (includesAny(q, ['hflow', 'hebbian robotics', 'hflow contributions', '#350', '#353', '#360', '#362', '#365', '#367', '#399', '#400', '#597', '#598']) || (q.includes('hebbian') && !q.includes('learning'))) {
      return `If you mean Hebbian Robotics: ${FACTS.hflow}`;
    }
    if (includesAny(q, ['charter', 'razorpay', 'agentic commerce', 'mcp'])) {
      return FACTS.charter;
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
    if (includesAny(q, ['inspect-robots', 'inspect robots', '#434', 'wandb', 'weights & biases', 'weights and biases'])) {
      return `${FACTS.inspectRobots} ${FACTS.inspectRobotsContribution}`;
    }
    if (includesAny(q, ['swiggy', 'campus ceo', 'marketing intern'])) {
      return FACTS.swiggy;
    }
    if (includesAny(q, ['link', 'github', 'linkedin', 'portfolio'])) {
      return `Resume links: email ${LINKS.email}, portfolio ${LINKS.portfolio}, LinkedIn ${LINKS.linkedin}, GitHub ${LINKS.github}, resume ${LINKS.resume}, HFlow ${LINKS.hflow}, Human Slop ${LINKS.humanSlop}, app ${LINKS.humanSlopApp}, Human Slop GitHub ${LINKS.humanSlopGithub}, Charter ${LINKS.charter}, digital twin ${LINKS.digitalTwin}, HeatCast ${LINKS.heatcast}, pond planning ${LINKS.pondPlanning}, Arista slides ${LINKS.aristaSlides}, Electron-GNN ${LINKS.electronGnn}, Open-PyFX ${LINKS.openPyfx}, crater detection ${LINKS.crater}, AntennaNet ${LINKS.antenna}, Serenity ${LINKS.serenity}, papers ${LINKS.openEmulator}, ${LINKS.risEnergy}, ${LINKS.risReview}.`;
    }
    if (includesAny(q, ['email', 'contact', 'phone', 'hire', 'recruit', 'reach'])) {
      return `${FACTS.contact} LinkedIn: ${LINKS.linkedin}. GitHub: ${LINKS.github}.`;
    }
    if (includesAny(q, ['resume', 'cv'])) {
      return `The resume is linked as ${LINKS.resume}. It includes Vamsi's experience, projects, skills, achievements, publications, email, LinkedIn, and GitHub.`;
    }
    if (includesAny(q, ['publication', 'paper', 'ieee', 'science', 'indicon'])) {
      return `${FACTS.publications} Links: ${LINKS.openEmulator}, ${LINKS.risEnergy}, ${LINKS.risReview}.`;
    }
    if (includesAny(q, ['experience', 'intern', 'ris', '6g', 'usrp', 'wireless'])) {
      return `${FACTS.experience} RIS GitHub: ${LINKS.ris}.`;
    }
    if (includesAny(q, ['human slop', 'startup', 'social', 'anti-ai', 'anti ai'])) {
      return `${FACTS.humanSlop} Web: ${LINKS.humanSlop}. App: ${LINKS.humanSlopApp}. GitHub: ${LINKS.humanSlopGithub}.`;
    }
    if (includesAny(q, ['arista', 'wi-fi', 'wifi', 'rrm', 'inter iit'])) {
      return `${FACTS.arista}`;
    }
    if (includesAny(q, ['electron', 'gnn', 'quantum'])) {
      return `Electron-GNN is a V3 two-tower GATv2 model predicting molecular absorption spectra from geometry. It was evaluated on 2 molecules with 39 and 55 target peaks. Faculty advisor: Dr. Soumajit Pramanik. GitHub: ${LINKS.electronGnn}.`;
    }
    if (includesAny(q, ['open-pyfx', 'pyfx', 'glsl', 'shader', 'video fx', 'video effects'])) {
      return `Open-PyFX is a Python and GLSL video FX suite for CRT emulation, ASCII edge detection, and 3D LUT workflows. GitHub: ${LINKS.openPyfx}.`;
    }
    if (includesAny(q, ['crater', 'lunar', 'moon', 'dem'])) {
      return `Lunar Crater Detection extracts craters from DEM data with F1 0.839 and a CuPy/CUDA morphology backend. GitHub: ${LINKS.crater}.`;
    }
    if (includesAny(q, ['antenna', 'meep', 'em design'])) {
      return `AntennaNet uses KD-tree nearest-neighbour anchoring for inverse EM design in 144D search spaces, with Python-MEEP on OpenMPI. GitHub: ${LINKS.antenna}.`;
    }
    if (includesAny(q, ['serenity', 'mental', 'wellness', 'flutter'])) {
      return `Serenity is a Flutter mental wellness app with CV-based real-time emotion detection, stress games, exercises, and doctor booking. GitHub: ${LINKS.serenity}.`;
    }
    if (includesAny(q, ['amazon', 'ml challenge', 'qwen', 'vit', 'roberta'])) {
      return `Amazon ML Challenge: Vamsi placed in the top 3.5%, using Qwen 2-VL 7B and a ViT/RoBERTa two-tower model for multimodal price prediction.`;
    }
    if (includesAny(q, ['blog', 'post', 'write-up', 'writeup', 'article', 'world model', 'jepa', 'push-t', 'pusht'])) {
      return `${FACTS.blog} Read it here: ${LINKS.blog}`;
    }
    if (includesAny(q, ['project', 'built', 'work'])) {
      return `${FACTS.projects} Ask for any project name and I can give the direct link if one exists.`;
    }
    if (includesAny(q, ['skill', 'stack', 'technology', 'tech'])) {
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
    about: 'Quick background and education.',
    experience: 'Research, startup work, and publications.',
    projects: 'Selected projects from the resume.',
    blog: 'Build logs from the experiments folder.',
    media: 'Personal videos, startup stories, and short films.',
    skills: 'Technical stack and research tools.',
    achievements: 'Competition and academic highlights.',
    research: 'Google Scholar, ResearchGate, IEEE, and publications.',
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
    const msgs = [{ role: 'system', content: SYSTEM }, ...history.slice(-12)];
    const body = direct
      ? { model: 'deepseek-v4-flash', messages: msgs, stream: true, max_tokens: 500, temperature: 0.5, thinking: { type: 'disabled' } }
      : { messages: history.slice(-12), context: SYSTEM };

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
      if (!answer) answer = localAnswer(text);
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
