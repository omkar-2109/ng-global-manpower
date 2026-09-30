const sharp = require('sharp');
const path = require('path');

async function generateOgPreview() {
  const width = 1200;
  const height = 630;

  const emblemPath = path.resolve(__dirname, '../public/brand/4_Brand_Emblem_Only/ng-emblem-transparent-1024px.png');
  const outputPath = path.resolve(__dirname, '../public/images/og-preview.png');

  // Resize emblem with transparent padding
  const emblemBuffer = await sharp(emblemPath)
    .resize(190, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020713" />
        <stop offset="45%" stop-color="#081A3E" />
        <stop offset="100%" stop-color="#030A1A" />
      </linearGradient>
      
      <radialGradient id="glowGold" cx="50%" cy="20%" r="55%">
        <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.22" />
        <stop offset="65%" stop-color="#081A3E" stop-opacity="0" />
      </radialGradient>

      <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFF2A3" />
        <stop offset="45%" stop-color="#E5C158" />
        <stop offset="100%" stop-color="#C59B27" />
      </linearGradient>

      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E5C158" stop-opacity="0.8" />
        <stop offset="50%" stop-color="#D4AF37" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#E5C158" stop-opacity="0.8" />
      </linearGradient>
    </defs>

    <!-- Base Canvas Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <rect width="${width}" height="${height}" fill="url(#glowGold)" />

    <!-- Outer Luxury Border -->
    <rect x="36" y="36" width="1128" height="558" rx="20" fill="none" stroke="url(#borderGrad)" stroke-width="1.5" />

    <!-- Corner Gold Accents -->
    <path d="M 30 70 L 30 30 L 70 30" fill="none" stroke="#E5C158" stroke-width="3" />
    <path d="M 1130 30 L 1170 30 L 1170 70" fill="none" stroke="#E5C158" stroke-width="3" />
    <path d="M 30 560 L 30 600 L 70 600" fill="none" stroke="#E5C158" stroke-width="3" />
    <path d="M 1130 600 L 1170 600 L 1170 560" fill="none" stroke="#E5C158" stroke-width="3" />

    <!-- Verification Pill Badge -->
    <g transform="translate(390, 60)">
      <rect width="420" height="34" rx="17" fill="#0A1D42" stroke="#D4AF37" stroke-width="1" stroke-opacity="0.5"/>
      <circle cx="20" cy="17" r="5" fill="#10B981" />
      <text x="36" y="22" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="700" fill="#FFF2A3" letter-spacing="1.5">GOVERNMENT REGISTERED • VERIFIED QUOTAS</text>
    </g>

    <!-- Brand Typography (NO feDropShadow filter to ensure clean rendering) -->
    <text x="600" y="318" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900" fill="url(#goldText)" letter-spacing="3">NG GLOBAL</text>
    <text x="600" y="352" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#93C5FD" letter-spacing="6">MANPOWER SERVICES</text>

    <!-- Headline Tagline -->
    <text x="600" y="408" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">Direct Overseas Employment Quotas &amp; Embassy Processing</text>
    <text x="600" y="442" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="500" fill="#94A3B8">100% Employer-Funded Positions • Regulated Charges • Gulf, Europe, USA &amp; New Zealand</text>

    <!-- Country Badges -->
    <g transform="translate(180, 475)">
      <!-- Saudi -->
      <rect x="0" y="0" width="130" height="38" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(212,175,55,0.4)" stroke-width="1"/>
      <text x="65" y="24" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#FFF2A3">🇸🇦 Saudi Arabia</text>
      
      <!-- UAE -->
      <rect x="145" y="0" width="125" height="38" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(212,175,55,0.4)" stroke-width="1"/>
      <text x="207" y="24" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#FFF2A3">🇦🇪 UAE Dubai</text>

      <!-- Qatar -->
      <rect x="285" y="0" width="115" height="38" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(212,175,55,0.4)" stroke-width="1"/>
      <text x="342" y="24" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#FFF2A3">🇶🇦 Qatar</text>

      <!-- Germany -->
      <rect x="415" y="0" width="125" height="38" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(212,175,55,0.4)" stroke-width="1"/>
      <text x="477" y="24" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#FFF2A3">🇩🇪 Germany</text>

      <!-- New Zealand -->
      <rect x="555" y="0" width="150" height="38" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(212,175,55,0.4)" stroke-width="1"/>
      <text x="630" y="24" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#FFF2A3">🇳🇿 New Zealand</text>

      <!-- USA -->
      <rect x="720" y="0" width="115" height="38" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(212,175,55,0.4)" stroke-width="1"/>
      <text x="777" y="24" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#FFF2A3">🇺🇸 USA</text>
    </g>

    <!-- Bottom Footer Domain Bar -->
    <text x="600" y="555" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#60A5FA" letter-spacing="1">🌐 https://ngglobalmp.in &#160;|&#160; Direct Candidate Intake &amp; Tracking Portal</text>
  </svg>
  `;

  await sharp(Buffer.from(svgOverlay))
    .composite([
      {
        input: emblemBuffer,
        top: 125,
        left: Math.round((width - 190) / 2)
      }
    ])
    .png()
    .toFile(outputPath);

  console.log(`[OG Preview] Successfully generated ${outputPath} (1200x630)`);
}

generateOgPreview().catch(err => {
  console.error('[OG Preview] Error generating image:', err);
  process.exit(1);
});
