// Script to generate the high-resolution VYRA Phoenix Compass Icon matching the user's uploaded image
import { writeFileSync } from "fs";
import { execSync } from "child_process";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Background Gradient (White to subtle pearl for depth) -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="85%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F7F7F8" />
    </radialGradient>

    <!-- Bronze Compass Ring Gradient -->
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF9D42" />
      <stop offset="25%" stop-color="#E86E1A" />
      <stop offset="50%" stop-color="#B84805" />
      <stop offset="75%" stop-color="#E86E1A" />
      <stop offset="100%" stop-color="#8C3000" />
    </linearGradient>

    <!-- Fiery Phoenix Body & Wings Primary Gradient -->
    <linearGradient id="firePrimary" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFA845" />
      <stop offset="20%" stop-color="#FF781E" />
      <stop offset="55%" stop-color="#F04E07" />
      <stop offset="85%" stop-color="#C22F00" />
      <stop offset="100%" stop-color="#7A1800" />
    </linearGradient>

    <!-- Wing Highlight Gradient -->
    <linearGradient id="wingHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFC570" />
      <stop offset="40%" stop-color="#FFA34D" />
      <stop offset="80%" stop-color="#FF6B1A" />
      <stop offset="100%" stop-color="#D43E00" />
    </linearGradient>

    <!-- Deep Flame Shadow Gradient -->
    <linearGradient id="fireShadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#C83800" />
      <stop offset="60%" stop-color="#8A1E00" />
      <stop offset="100%" stop-color="#4E0C00" />
    </linearGradient>

    <!-- Titanium Chiseled Text Gradient -->
    <linearGradient id="metalBevelTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="35%" stop-color="#E2E2E6" />
      <stop offset="65%" stop-color="#A8A8B2" />
      <stop offset="100%" stop-color="#6B6B75" />
    </linearGradient>

    <linearGradient id="metalBevelBottom" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8C8C96" />
      <stop offset="40%" stop-color="#54545C" />
      <stop offset="80%" stop-color="#323238" />
      <stop offset="100%" stop-color="#1E1E22" />
    </linearGradient>

    <!-- Drop Shadow Filter for Letters -->
    <filter id="chiseledShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="0.65" />
    </filter>

    <!-- Subtle Feather Shadow -->
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Clean Background Canvas -->
  <rect width="1024" height="1024" fill="url(#bgGrad)" />

  <g transform="translate(512, 512)">
    <!-- ================= COMPASS DIAL RINGS ================= -->
    <!-- Outer Heavy Bronze Ring -->
    <circle cx="0" cy="0" r="416" fill="none" stroke="url(#ringGrad)" stroke-width="14" />
    <!-- Secondary Thin Inner Track -->
    <circle cx="0" cy="0" r="392" fill="none" stroke="url(#ringGrad)" stroke-width="4.5" opacity="0.9" />

    <!-- Notches / Segments around the dial -->
    <g stroke="url(#ringGrad)" stroke-width="3" opacity="0.75">
      <!-- 8-Division Dial Ticks -->
      <line x1="0" y1="-416" x2="0" y2="-392" />
      <line x1="0" y1="392" x2="0" y2="416" />
      <line x1="-416" y1="0" x2="-392" y2="0" />
      <line x1="392" y1="0" x2="416" y2="0" />
      <line x1="-294" y1="-294" x2="-277" y2="-277" />
      <line x1="277" y1="-277" x2="294" y2="-294" />
      <line x1="-294" y1="294" x2="-277" y2="277" />
      <line x1="277" y1="277" x2="294" y2="294" />
    </g>

    <!-- ================= COMPASS POINTS ================= -->
    <!-- North Top Pointer (Tall Arrowhead with 3D Facets) -->
    <g filter="url(#softShadow)">
      <polygon points="0,-490 24,-412 0,-422" fill="#FFA34D" />
      <polygon points="0,-490 -24,-412 0,-422" fill="#B84805" />
      <line x1="0" y1="-490" x2="0" y2="-422" stroke="#FFDE99" stroke-width="1.5" />
    </g>

    <!-- West Left Pointer -->
    <g filter="url(#softShadow)">
      <polygon points="-470,0 -412,-20 -420,0" fill="#FFA34D" />
      <polygon points="-470,0 -412,20 -420,0" fill="#B84805" />
    </g>

    <!-- East Right Pointer -->
    <g filter="url(#softShadow)">
      <polygon points="470,0 412,-20 420,0" fill="#FFA34D" />
      <polygon points="470,0 412,20 420,0" fill="#B84805" />
    </g>

    <!-- ================= PHOENIX WINGS (UPWARD SWEEP) ================= -->
    <!-- Left Wing Layers -->
    <!-- Outer Wing Arc Blade -->
    <path d="M 0,-140 C -120,-240 -320,-380 -450,-380 C -390,-270 -310,-190 -210,-130 C -290,-160 -390,-200 -430,-170 C -370,-110 -270,-70 -160,-50 C -250,-70 -340,-70 -360,-40 C -290,0 -180,20 -70,20 Z" 
          fill="url(#firePrimary)" filter="url(#softShadow)" />

    <!-- Left Wing Interior Bevel Highlights -->
    <path d="M 0,-140 C -100,-220 -280,-340 -450,-380 C -350,-290 -240,-200 -120,-110 Z" 
          fill="url(#wingHighlight)" opacity="0.9" />
    <path d="M -160,-50 C -270,-100 -360,-130 -430,-170 C -340,-130 -220,-80 -90,-40 Z" 
          fill="url(#wingHighlight)" opacity="0.8" />
    <path d="M -70,20 C -180,-10 -270,-20 -360,-40 C -260,-20 -150,5 -40,30 Z" 
          fill="url(#wingHighlight)" opacity="0.7" />

    <!-- Left Wing Shadow Underside Facets -->
    <path d="M -210,-130 C -260,-145 -330,-165 -380,-155 C -300,-110 -210,-75 -130,-45 Z" 
          fill="url(#fireShadow)" opacity="0.65" />

    <!-- Right Wing Layers (Mirrored) -->
    <!-- Outer Wing Arc Blade -->
    <path d="M 0,-140 C 120,-240 320,-380 450,-380 C 390,-270 310,-190 210,-130 C 290,-160 390,-200 430,-170 C 370,-110 270,-70 160,-50 C 250,-70 340,-70 360,-40 C 290,0 180,20 70,20 Z" 
          fill="url(#firePrimary)" filter="url(#softShadow)" />

    <!-- Right Wing Interior Bevel Highlights -->
    <path d="M 0,-140 C 100,-220 280,-340 450,-380 C 350,-290 240,-200 120,-110 Z" 
          fill="url(#wingHighlight)" opacity="0.9" />
    <path d="M 160,-50 C 270,-100 360,-130 430,-170 C 340,-130 220,-80 90,-40 Z" 
          fill="url(#wingHighlight)" opacity="0.8" />
    <path d="M 70,20 C 180,-10 270,-20 360,-40 C 260,-20 150,5 40,30 Z" 
          fill="url(#wingHighlight)" opacity="0.7" />

    <!-- Right Wing Shadow Underside Facets -->
    <path d="M 210,-130 C 260,-145 330,-165 380,-155 C 300,-110 210,-75 130,-45 Z" 
          fill="url(#fireShadow)" opacity="0.65" />

    <!-- ================= PHOENIX HEAD & CREST ================= -->
    <!-- Rising Flame Crest (Pointing up toward North) -->
    <g filter="url(#softShadow)">
      <polygon points="0,-180 80,-260 95,-280 60,-250 85,-300 0,-210" fill="#FFC570" />
      <polygon points="0,-180 60,-250 85,-300 0,-220 -20,-200" fill="url(#firePrimary)" />
      <!-- Phoenix Head Facing Left -->
      <!-- Crown -->
      <path d="M 0,-210 C -25,-205 -55,-190 -70,-165 C -60,-155 -30,-150 -10,-155 Z" fill="url(#wingHighlight)" />
      <!-- Beak & Chin -->
      <path d="M -70,-165 L -105,-150 L -68,-140 C -60,-130 -30,-125 0,-130 Z" fill="url(#firePrimary)" />
      <polygon points="-70,-165 -105,-150 -68,-148" fill="#FFDE99" />
      <!-- Sharp Golden Eye -->
      <polygon points="-58,-160 -48,-163 -42,-158 -52,-155" fill="#FFFFFF" />
      <circle cx="-50" cy="-159" r="3" fill="#1A1A1E" />
    </g>

    <!-- ================= PHOENIX LOWER BODY & TAIL FEATHERS ================= -->
    <!-- South Compass Point (Elongated Central Spine/Blade extending to y=485) -->
    <g filter="url(#softShadow)">
      <!-- Left Tail Flank Feather -->
      <polygon points="-25,120 -115,220 -85,290 -50,330 -15,160" fill="url(#fireShadow)" />
      <polygon points="-25,120 -85,290 -50,330 -15,160" fill="url(#firePrimary)" />
      <polygon points="-25,120 -50,330 -15,160" fill="url(#wingHighlight)" opacity="0.6" />

      <!-- Right Tail Flank Feather -->
      <polygon points="25,120 115,220 85,290 50,330 15,160" fill="url(#fireShadow)" />
      <polygon points="25,120 85,290 50,330 15,160" fill="url(#firePrimary)" />
      <polygon points="25,120 50,330 15,160" fill="url(#wingHighlight)" opacity="0.6" />

      <!-- Center Long Dagger Feather (Forms South Compass Point at 485px) -->
      <!-- Left Facet (Shadowed) -->
      <polygon points="0,90 -42,260 -24,370 0,485 0,90" fill="url(#fireShadow)" />
      <!-- Right Facet (Highlighted) -->
      <polygon points="0,90 42,260 24,370 0,485 0,90" fill="url(#firePrimary)" />
      <!-- Central Ridge Highlight -->
      <polygon points="0,90 8,260 5,370 0,485 -3,370 -5,260" fill="#FFC570" opacity="0.85" />
    </g>

    <!-- ================= 6 WHITE ATHLETE SILHOUETTES ================= -->
    <!-- 1. Top-Left: ROWER (Pulling oar on upper wing) -->
    <g transform="translate(-390, -280) scale(1.1)" fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round">
      <circle cx="15" cy="5" r="5" stroke="none" />
      <!-- Torso leaned back in rowing drive phase -->
      <path d="M 12,12 L 28,18 L 18,34 L 10,26 Z" stroke-width="1.5" />
      <path d="M 0,26 L 15,15" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Legs and feet on footplate -->
      <path d="M 18,34 L 32,32 L 36,22" stroke-width="3.5" stroke-linecap="round" fill="none" />
    </g>

    <!-- 2. Mid-Left: SPRINTER (Running forward along arc) -->
    <g transform="translate(-345, -170) scale(1.15)" fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round">
      <circle cx="20" cy="5" r="5" stroke="none" />
      <!-- Forward driving runner torso -->
      <path d="M 14,13 L 26,10 L 32,18 L 22,25 Z" stroke-width="1.5" />
      <!-- Driving Arms -->
      <path d="M 16,13 L 6,18 M 24,11 L 34,16" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Powerful Leg Stride -->
      <path d="M 22,25 L 32,35 L 24,42 M 16,23 L 6,31 L 2,24" stroke-width="3.5" stroke-linecap="round" fill="none" />
    </g>

    <!-- 3. Lower-Left: WEIGHTLIFTER (Snatch / Overhead squat with barbell) -->
    <g transform="translate(-185, -145) scale(1.2)" fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round">
      <!-- Barbell & Plates -->
      <line x1="-12" y1="6" x2="48" y2="6" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" />
      <rect x="-16" y="0" width="5" height="12" rx="1.5" fill="#FFFFFF" stroke="none" />
      <rect x="47" y="0" width="5" height="12" rx="1.5" fill="#FFFFFF" stroke="none" />
      <!-- Athlete Head & Torso -->
      <circle cx="18" cy="16" r="5" stroke="none" />
      <!-- Arms locked out overhead -->
      <path d="M 2,7 L 14,19 M 34,7 L 22,19" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <!-- Torso and Deep Squat Stance -->
      <path d="M 14,20 L 22,20 L 24,30 L 12,30 Z" stroke-width="1.5" />
      <path d="M 13,30 L 3,36 L 4,46 M 23,30 L 33,36 L 32,46" stroke-width="3.8" stroke-linecap="round" fill="none" />
    </g>

    <!-- 4. Lower-Right: GYMNAST / RINGS (Iron Cross / Muscle-up suspension) -->
    <g transform="translate(145, -145) scale(1.2)" fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round">
      <!-- Straps and Rings -->
      <line x1="0" y1="2" x2="6" y2="18" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
      <line x1="36" y1="2" x2="30" y2="18" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="6" cy="20" r="3.5" fill="none" stroke="#FFFFFF" stroke-width="2" />
      <circle cx="30" cy="20" r="3.5" fill="none" stroke="#FFFFFF" stroke-width="2" />
      <!-- Gymnast Head & Body suspended -->
      <circle cx="18" cy="18" r="5" stroke="none" />
      <!-- Extended Arms gripping rings -->
      <path d="M 8,20 L 15,22 M 28,20 L 21,22" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <!-- L-sit / Hollow Body Legs -->
      <path d="M 14,22 L 22,22 L 20,34 L 16,34 Z" stroke-width="1.5" />
      <path d="M 18,34 L 28,42 L 36,44" stroke-width="3.5" stroke-linecap="round" fill="none" />
    </g>

    <!-- 5. Mid-Right: CYCLIST (Riding road bike along circle arc) -->
    <g transform="translate(290, -170) scale(1.15)" fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round">
      <!-- Bike Wheels -->
      <circle cx="8" cy="30" r="9" fill="none" stroke="#FFFFFF" stroke-width="2.8" />
      <circle cx="40" cy="30" r="9" fill="none" stroke="#FFFFFF" stroke-width="2.8" />
      <!-- Bike Frame & Handlebars -->
      <path d="M 8,30 L 22,30 L 32,18 L 18,18 Z M 22,30 L 20,16 M 32,18 L 38,12 L 42,14" 
            stroke-width="2.2" stroke-linecap="round" fill="none" />
      <!-- Cyclist Head & Aero Posture -->
      <circle cx="25" cy="8" r="4.5" stroke="none" />
      <path d="M 21,14 L 30,12 L 35,14 M 20,16 L 24,24 L 22,30" 
            stroke-width="3.2" stroke-linecap="round" fill="none" />
    </g>

    <!-- 6. Top-Right: HURDLER / RUNNER (Leaping forward along top arc) -->
    <g transform="translate(330, -280) scale(1.1)" fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round">
      <circle cx="18" cy="5" r="5" stroke="none" />
      <!-- Forward leaning torso -->
      <path d="M 12,12 L 24,9 L 28,18 L 18,24 Z" stroke-width="1.5" />
      <!-- Extended Arms -->
      <path d="M 14,12 L 5,16 M 22,10 L 32,13" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Split Stride Leap -->
      <path d="M 18,24 L 28,34 L 38,36 M 14,22 L 8,30 L 2,36" stroke-width="3.5" stroke-linecap="round" fill="none" />
    </g>

    <!-- ================= 3D METALLIC CHISELED 'VYRA' TEXT ================= -->
    <!-- Dark Outline / Backplate Glow behind letters for contrast -->
    <g filter="url(#chiseledShadow)">
      <!-- V -->
      <path d="M -310,-45 L -265,-45 L -220,55 L -175,-45 L -130,-45 L -202,78 L -238,78 Z" 
            fill="#141418" stroke="#0A0A0C" stroke-width="14" stroke-linejoin="round" />
      <!-- Y -->
      <path d="M -155,-45 L -115,-45 L -75,10 L -75,78 L -35,78 L -35,10 L 5,-45 L -35,-45 L -55,-12 L -75,-45 Z" 
            fill="#141418" stroke="#0A0A0C" stroke-width="14" stroke-linejoin="round" />
      <!-- R -->
      <path d="M -10,-45 L 75,-45 C 115,-45 138,-28 138,5 C 138,30 120,44 95,48 L 140,78 L 95,78 L 60,50 L 25,50 L 25,78 L -10,78 Z 
               M 25,-15 L 70,-15 C 88,-15 100,-8 100,5 C 100,18 88,24 70,24 L 25,24 Z" 
            fill="#141418" stroke="#0A0A0C" stroke-width="14" stroke-linejoin="round" />
      <!-- A -->
      <path d="M 160,-45 L 205,-45 L 280,78 L 235,78 L 220,50 L 150,50 L 135,78 L 90,78 Z 
               M 162,25 L 208,25 L 185,-15 Z" 
            fill="#141418" stroke="#0A0A0C" stroke-width="14" stroke-linejoin="round" />
    </g>

    <!-- Metallic Shaded Inner Bevel Fill -->
    <g filter="url(#chiseledShadow)">
      <!-- V -->
      <path d="M -310,-45 L -265,-45 L -220,55 L -175,-45 L -130,-45 L -202,78 L -238,78 Z" 
            fill="url(#metalBevelTop)" stroke="#222228" stroke-width="3" />
      <!-- Inner facet ridge for V -->
      <polygon points="-310,-45 -220,55 -238,78" fill="url(#metalBevelBottom)" opacity="0.5" />
      <polygon points="-130,-45 -220,55 -202,78" fill="#FFFFFF" opacity="0.35" />

      <!-- Y -->
      <path d="M -155,-45 L -115,-45 L -75,10 L -75,78 L -35,78 L -35,10 L 5,-45 L -35,-45 L -55,-12 L -75,-45 Z" 
            fill="url(#metalBevelTop)" stroke="#222228" stroke-width="3" />
      <polygon points="-155,-45 -75,10 -75,78 -55,78" fill="url(#metalBevelBottom)" opacity="0.5" />
      <polygon points="5,-45 -35,10 -35,78 -55,78" fill="#FFFFFF" opacity="0.35" />

      <!-- R -->
      <path d="M -10,-45 L 75,-45 C 115,-45 138,-28 138,5 C 138,30 120,44 95,48 L 140,78 L 95,78 L 60,50 L 25,50 L 25,78 L -10,78 Z 
               M 25,-15 L 70,-15 C 88,-15 100,-8 100,5 C 100,18 88,24 70,24 L 25,24 Z" 
            fill="url(#metalBevelTop)" stroke="#222228" stroke-width="3" />
      <polygon points="-10,-45 25,-45 25,78 -10,78" fill="url(#metalBevelBottom)" opacity="0.45" />
      <polygon points="60,50 95,48 140,78 95,78" fill="url(#metalBevelBottom)" opacity="0.6" />

      <!-- A -->
      <path d="M 160,-45 L 205,-45 L 280,78 L 235,78 L 220,50 L 150,50 L 135,78 L 90,78 Z 
               M 162,25 L 208,25 L 185,-15 Z" 
            fill="url(#metalBevelTop)" stroke="#222228" stroke-width="3" />
      <polygon points="90,78 160,-45 185,-15 135,78" fill="url(#metalBevelBottom)" opacity="0.5" />
      <polygon points="205,-45 280,78 235,78 185,-15" fill="#FFFFFF" opacity="0.35" />
    </g>
  </g>
</svg>
`;

writeFileSync("public/logo.svg", svg);
writeFileSync("assets/images/logo.svg", svg);
writeFileSync("frontend/assets/images/logo.svg", svg);

console.log("SVG logo files created successfully!");

// Convert SVG to PNG using ffmpeg at 512x512 and 1024x1024
const commands = [
  // 512x512 icons
  "ffmpeg -i public/logo.svg -s 512x512 -y assets/images/icon.png",
  "ffmpeg -i public/logo.svg -s 512x512 -y assets/images/adaptive-icon.png",
  "ffmpeg -i public/logo.svg -s 512x512 -y frontend/assets/images/icon.png",
  "ffmpeg -i public/logo.svg -s 512x512 -y frontend/assets/images/adaptive-icon.png",
  // 256x256 favicon
  "ffmpeg -i public/logo.svg -s 256x256 -y assets/images/favicon.png",
  "ffmpeg -i public/logo.svg -s 256x256 -y frontend/assets/images/favicon.png",
];

for (const cmd of commands) {
  console.log("Running:", cmd);
  execSync(cmd, { stdio: "inherit" });
}

console.log("All icon assets generated successfully!");
