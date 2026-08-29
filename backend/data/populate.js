const fs = require('fs');

async function main() {
  const file = './universities.json';
  const universities = JSON.parse(fs.readFileSync(file, 'utf8'));
  let updated = 0;

  console.log(`Processing ${universities.length} universities...`);

  for (let i = 0; i < universities.length; i++) {
    const uni = universities[i];
    
    // Skip if it already has an imageUrl that is not a placeholder
    if (uni.imageUrl && !uni.imageUrl.includes('unsplash') && !uni.imageUrl.includes('placeholder')) {
      continue;
    }

    try {
      const query = encodeURIComponent(uni.university_name);
      
      // 1. Try Clearbit Autocomplete to get the domain
      const autoRes = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${query}`);
      const autoData = await autoRes.json();

      if (autoData && autoData.length > 0 && autoData[0].domain) {
        const domain = autoData[0].domain;
        uni.imageUrl = autoData[0].logo || `https://icon.horse/icon/${domain}`;
        updated++;
        console.log(`[${i+1}/${universities.length}] Found domain for ${uni.university_name}: ${domain}`);
        // Small delay to prevent rate limiting
        await new Promise(r => setTimeout(r, 100));
        continue;
      }

      // 2. Try Wikipedia
      const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrlimit=1&prop=pageimages&pithumbsize=1000&format=json&origin=*`);
      const wikiData = await wikiRes.json();

      if (wikiData.query && wikiData.query.pages) {
        const pages = wikiData.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        if (page && page.thumbnail && page.thumbnail.source) {
          uni.imageUrl = page.thumbnail.source;
          updated++;
          console.log(`[${i+1}/${universities.length}] Found Wikipedia image for ${uni.university_name}`);
          await new Promise(r => setTimeout(r, 100));
          continue;
        }
      }

      console.log(`[${i+1}/${universities.length}] No image found for ${uni.university_name}`);
      
    } catch (err) {
      console.log(`[${i+1}/${universities.length}] Error processing ${uni.university_name}:`, err.message);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }

  fs.writeFileSync(file, JSON.stringify(universities, null, 2));
  console.log(`Done! Updated ${updated} universities.`);
}

main().catch(console.error);
