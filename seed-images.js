require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAPPINGS = [
  { slugMatch: 'hiace', file: 'hiace-lwb.jpg' },
  { slugMatch: 'sprinter-l2', file: 'sprinter-l2h2.jpg' },
  { slugMatch: 'sprinter-l3', file: 'sprinter-l3h3.jpg' },
  { slugMatch: 'transit', file: 'transit-custom.jpg' },
  { slugMatch: 'sprinter', file: 'sprinter-l2h2.jpg' }, // fallback for other sprinters
];

async function seedImages() {
  console.log("Fetching vans...");
  const { data: vans, error: vansError } = await supabase.from('vans').select('id, slug, name');
  if (vansError) {
    console.error("Failed to fetch vans:", vansError);
    return;
  }

  for (const van of vans) {
    // Find matching image
    let fileName = null;
    for (const mapping of MAPPINGS) {
      if (van.slug.includes(mapping.slugMatch) || van.name.toLowerCase().includes(mapping.slugMatch)) {
        fileName = mapping.file;
        break;
      }
    }

    if (!fileName) continue;
    console.log(`Processing ${van.name}... assigning ${fileName}`);

    const filePath = path.join(__dirname, 'public', 'vans', fileName);
    if (!fs.existsSync(filePath)) continue;

    const storagePath = `${van.slug}-primary.jpg`;
    
    // Upload to storage
    const fileBuffer = fs.readFileSync(filePath);
    const { error: uploadError } = await supabase.storage
      .from('van-images')
      .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
      console.error(`Failed to upload image for ${van.slug}:`, uploadError);
      // Might already exist or bucket doesn't exist?
    }

    // Insert into van_images
    const { error: insertError } = await supabase.from('van_images').insert({
      van_id: van.id,
      storage_path: storagePath,
      is_primary: true,
      sort_order: 0,
      alt: van.name + " - XPDX Rentals"
    });

    if (insertError) {
      console.error(`Failed to link image for ${van.slug}:`, insertError);
    } else {
      console.log(`Successfully linked image for ${van.slug}`);
    }
  }
  console.log("Done.");
}

seedImages();
