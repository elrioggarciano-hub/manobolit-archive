import fs from 'fs';
setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
console.log('Sample entry keys:', Object.keys(entries[0]));
console.log('Sample communityLocation:', entries[0].communityLocation);
console.log('Unique communityLocations:', Array.from(new Set(entries.map((e: any) => e.communityLocation))));

process.exit(0);
