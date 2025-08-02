// Test script for ChartVision API
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key_here';

async function testChartVision(imagePath) {
  console.log('🎯 Testing ChartVision API...\n');

  try {
    // Create form data
    const formData = new FormData();
    
    // For testing, we'll create a simple test image if none provided
    if (!imagePath) {
      console.log('⚠️  No image provided, using test mode...');
      // Create a minimal test blob
      const testImageBlob = new Blob(['test'], { type: 'image/png' });
      formData.append('image', testImageBlob, 'test.png');
    } else {
      const imageBuffer = fs.readFileSync(imagePath);
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('image', blob, path.basename(imagePath));
    }

    // Make API request
    console.log('📤 Sending request to ChartVision...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chartvision`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: formData
    });

    console.log(`📥 Response status: ${response.status}`);

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ ChartVision Response:');
      console.log('-------------------');
      console.log('Charts detected:', result.metadata?.charts_detected || 0);
      console.log('Filters detected:', result.metadata?.filters_detected || 0);
      console.log('KPIs detected:', result.metadata?.kpis_detected || 0);
      console.log('Layout:', JSON.stringify(result.metadata?.layout));
      
      // Save outputs
      if (result.context_json) {
        fs.writeFileSync('chartvision-context.json', JSON.stringify(result.context_json, null, 2));
        console.log('\n📄 Context saved to: chartvision-context.json');
      }
      
      if (result.react_code) {
        fs.writeFileSync('chartvision-dashboard.tsx', result.react_code);
        console.log('📄 React code saved to: chartvision-dashboard.tsx');
      }
    } else {
      console.error('\n❌ Error:', result.error);
      console.error('Details:', result.details);
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  // Node.js polyfill for FormData and Blob
  global.FormData = require('form-data');
  global.Blob = class Blob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options?.type || '';
    }
  };
  global.fetch = require('node-fetch');
}

// Run test
const imagePath = process.argv[2];
testChartVision(imagePath)
  .then(() => console.log('\n✨ Test complete!'))
  .catch(console.error);