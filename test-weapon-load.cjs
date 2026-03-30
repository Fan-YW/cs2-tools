const fs = require('fs');
const path = require('path');

// 模拟publicUrl函数
function publicUrl(relativePath) {
  return path.join('public', relativePath);
}

// 模拟loadWeaponsJson函数
async function loadWeaponsJson() {
  const manifestPath = publicUrl('weapon/manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  const jsonName = manifest.weaponsJson && typeof manifest.weaponsJson === 'string' ? manifest.weaponsJson : 'weapons.json';
  const dataPath = publicUrl(`weapon/${jsonName}`);
  const dataContent = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(dataContent);
}

// 测试函数
async function test() {
  try {
    console.log('Loading weapons data...');
    const data = await loadWeaponsJson();
    console.log('Successfully loaded weapons data');
    console.log('Data structure:', Object.keys(data));
    if (data.weapons) {
      console.log('Number of weapons:', data.weapons.length);
      // 查找revolver武器
      const revolver = data.weapons.find(w => w.id === 'revolver');
      if (revolver) {
        console.log('Found revolver weapon');
        console.log('Revolver has note:', !!revolver.note);
        if (revolver.note) {
          console.log('Note contents:', revolver.note);
        }
      } else {
        console.log('Could not find revolver weapon');
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
  }
}

test();