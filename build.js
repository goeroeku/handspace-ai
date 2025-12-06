const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const cssnano = require('cssnano');
const postcss = require('postcss');
const JavaScriptObfuscator = require('javascript-obfuscator');

async function build() {
  console.log('🔨 Building production files...\n');

  // Clean up any production files in root (should not be there)
  const rootProdFiles = ['script.min.js', 'style.min.css', 'index.dev.html'];
  rootProdFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`🧹 Removed ${file} from root\n`);
    }
  });

  // Buat folder dist jika belum ada
  const distDir = 'dist';
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
    console.log('📁 Created dist folder\n');
  } else {
    // Clear dist folder
    const files = fs.readdirSync(distDir);
    for (const file of files) {
      fs.unlinkSync(path.join(distDir, file));
    }
    console.log('🧹 Cleaned dist folder\n');
  }

  // Minify & Obfuscate JavaScript
  console.log('📦 Processing script.js...');
  const jsCode = fs.readFileSync('script.js', 'utf8');
  
  // Step 1: Minify
  const minified = await minify(jsCode, {
    compress: {
      drop_console: false, // Set true jika ingin hapus console.log
      drop_debugger: true,
      pure_funcs: ['console.debug', 'console.trace']
    },
    mangle: {
      toplevel: true,
      properties: {
        regex: /^_/
      }
    },
    format: {
      comments: false
    }
  });

  // Step 2: Obfuscate (membuat kode lebih sulit dibaca)
  const obfuscationResult = JavaScriptObfuscator.obfuscate(minified.code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false, // Set true untuk anti-debug (bisa bikin error)
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
  });

  fs.writeFileSync(path.join(distDir, 'script.min.js'), obfuscationResult.getObfuscatedCode());
  console.log('✅ dist/script.min.js created\n');

  // Minify CSS
  console.log('📦 Processing style.css...');
  const cssCode = fs.readFileSync('style.css', 'utf8');
  const result = await postcss([cssnano({
    preset: ['default', {
      discardComments: {
        removeAll: true
      },
      normalizeWhitespace: true
    }]
  })]).process(cssCode, { from: 'style.css' });

  fs.writeFileSync(path.join(distDir, 'style.min.css'), result.css);
  console.log('✅ dist/style.min.css created\n');

  // Buat file production HTML di dist folder
  console.log('📝 Creating production index.html...');
  let html = fs.readFileSync('index.html', 'utf8');
  
  // Replace script.js dengan script.min.js
  html = html.replace(
    '<script type="module" src="script.js"></script>',
    '<script type="module" src="script.min.js"></script>'
  );
  
  // Replace style.css dengan style.min.css
  html = html.replace(
    '<link rel="stylesheet" href="style.css" />',
    '<link rel="stylesheet" href="style.min.css" />'
  );

  // Ensure config.js script is present (should already be in index.html, but double-check)
  if (!html.includes('<script src="config.js"></script>')) {
    console.log('⚠️  Warning: config.js script not found in index.html, adding it...\n');
    // Add config.js before import maps
    html = html.replace(
      '<!-- Import Maps -->',
      '<!-- Configuration -->\n    <script src="config.js"></script>\n\n    <!-- Import Maps -->'
    );
  }

  // Ensure UI initialization script is present
  if (!html.includes('window.APP_CONFIG')) {
    console.log('⚠️  Warning: UI initialization script not found, adding it...\n');
    // Add initialization script before main logic
    const initScript = `
    <!-- Initialize UI from Config -->
    <script>
      // Apply configuration to UI elements
      if (window.APP_CONFIG) {
        const config = window.APP_CONFIG;
        
        // Update page title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
          pageTitle.textContent = \`\${config.appTitle} - \${config.organizationName}\`;
        }
        
        // Update header credit
        const orgName = document.getElementById('org-name');
        if (orgName) orgName.textContent = config.organizationName;
        
        const orgWebsiteLink = document.getElementById('org-website');
        if (orgWebsiteLink) {
          orgWebsiteLink.href = config.websiteUrl;
        }
        
        const orgWebsiteDisplay = document.getElementById('org-website-display');
        if (orgWebsiteDisplay) {
          orgWebsiteDisplay.textContent = config.websiteDisplay;
        }
        
        // Update logo
        const logo = document.getElementById('game-logo');
        if (logo) {
          logo.src = config.logoUrl;
          logo.alt = config.logoAlt;
        }
        
        // Update loading text
        const loaderText = document.getElementById('loader-text');
        if (loaderText) loaderText.textContent = config.loadingText;
        
        const loaderHint = document.getElementById('loader-hint');
        if (loaderHint) loaderHint.textContent = config.loadingHint;
        
        // Update status text
        const status = document.getElementById('status');
        if (status) status.textContent = config.waitingText;
      }
    </script>
`;
    html = html.replace(
      '<!-- Main Logic -->',
      initScript + '\n    <!-- Main Logic -->'
    );
  }

  // Write index.html ke dist folder
  fs.writeFileSync(path.join(distDir, 'index.html'), html);
  console.log('✅ dist/index.html created\n');

  // Copy config.js to dist (not minified, so users can edit it)
  console.log('📦 Copying config.js...');
  if (fs.existsSync('config.js')) {
    fs.copyFileSync('config.js', path.join(distDir, 'config.js'));
    console.log('✅ dist/config.js copied\n');
  } else if (fs.existsSync('config.js.example')) {
    // Copy example as fallback if config.js doesn't exist
    fs.copyFileSync('config.js.example', path.join(distDir, 'config.js'));
    console.log('⚠️  config.js not found, copied config.js.example as fallback\n');
  } else {
    console.log('⚠️  config.js and config.js.example not found, config.js will be missing in dist/\n');
  }

  console.log('🎉 Build completed successfully!');
  console.log('\n📋 Production files ready in dist/ folder:');
  console.log('   - dist/index.html');
  console.log('   - dist/script.min.js');
  console.log('   - dist/style.min.css');
  if (fs.existsSync(path.join(distDir, 'config.js'))) {
    console.log('   - dist/config.js');
  }
  console.log('\n📋 Next steps:');
  console.log('   1. Test dist/index.html dengan HTTP server');
  console.log('   2. Deploy folder dist/ ke GitHub Pages');
  console.log('   3. Atau copy isi dist/ ke root repository untuk GitHub Pages');
}

build().catch(console.error);

