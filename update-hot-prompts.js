require('dotenv').config({ path: '.env.local' });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Ошибка: Не найдены переменные окружения");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Новые промпты Hot - более мягкие, сексуальные но не раздевающие
const newHotPrompts = [
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'original',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself. Keep original background. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles - enhance beauty while keeping skin realistic and living, NOT plastic. Make her more attractive and sexy through confident posture, alluring gaze, and flattering outfit that accentuates curves WITHOUT nudity or revealing intimate areas. Enhanced makeup, styled hair, elegant confident expression. Photorealistic, natural, living appearance. Remove any objects from hands and neck.'
  },
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'home',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в уютной домашней обстановке в стильной домашней одежде - элегантный шелковый халат, модная пижама или уютный свитер с леггинсами. Confident relaxed pose. Убери любые предметы из рук и с шеи. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles - enhance beauty while keeping skin realistic and living, NOT plastic. Sexy but tasteful, no nudity. Enhanced features, confident expression. Photorealistic result.'
  },
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'bathtub',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself возле красивой ванны в роскошном банном халате или элегантном полотенце, обернутом вокруг тела. IMPORTANT: человек НЕ должен находиться в самой ванне. Убери любые предметы из рук и с шеи. Confident alluring pose, but FULLY COVERED - no nudity, no exposed intimate areas. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles - enhance beauty while keeping skin realistic and living, NOT plastic. Sexy spa/wellness atmosphere but tasteful. Photorealistic result.'
  },
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'bedroom',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в спальне в элегантной шелковой пижаме или красивом ночном белье, ПОЛНОСТЬЮ покрывающем тело. Confident sensual pose on bed. Убери любые предметы из рук и с шеи. IMPORTANT: NO NUDITY - outfit must cover intimate areas fully. Make her sexy through confidence, posture, expression, NOT through revealing clothing. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles - enhance beauty while keeping skin realistic, NOT plastic. Photorealistic result.'
  },
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'office',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в офисе в стильной деловой одежде - fitted blazer, pencil skirt or elegant dress, professional but flattering outfit. Confident professional pose. Убери любые предметы из рук и с шеи. IMPORTANT: Professional attire only - NO exposed intimate areas, NO inappropriate revealing clothing. Make her sexy through confidence, style, posture. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles. Photorealistic professional result.'
  },
  
  // NanoBana Hot
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'original',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself using advanced AI upscaling. Keep original background. CRUCIAL: Create ONE seamless professional photo - blend perfectly. Preserve micro skin details, texture, freckles, marks. Enhance beauty significantly while keeping skin ultra-realistic, NOT plastic. Make her sexy through confident posture, alluring expression, and flattering outfit that enhances her figure WITHOUT nudity. Enhanced styling, confident seductive gaze. Premium photorealistic result. Remove objects from hands/neck.'
  },
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'home',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в уютной домашней обстановке в стильной comfortable clothing - silk robe, fashionable loungewear. Confident relaxed pose. Убери любые предметы из рук и с шеи. Use advanced neural upscaling. CRUCIAL: One unified professional photo - blend seamlessly. Preserve skin micro-details, freckles. Enhance beauty while keeping ultra-realistic. Sexy but tasteful, NO nudity. Premium iPhone 17 Pro Max quality.'
  },
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'bathtub',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself возле ванны в роскошном халате или элегантном полотенце. IMPORTANT: НЕ в самой ванне. Убери предметы из рук и шеи. Confident pose, FULLY COVERED - no nudity. Use advanced upscaling. CRUCIAL: One seamless photo - blend perfectly. Preserve skin micro-details, texture, marks. Enhance beauty while keeping ultra-realistic. Sexy spa atmosphere but tasteful, fully covered. Premium photorealistic quality.'
  },
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'bedroom',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в спальне в элегантной пижаме или nightwear that FULLY COVERS body. Confident sensual pose. Убери предметы из рук и шеи. NO NUDITY - outfit fully covers intimate areas. Sexy through confidence, NOT revealing. Use advanced upscaling. CRUCIAL: One seamless photo. Preserve skin micro-details, freckles. Ultra-realistic skin, NOT plastic. Premium photorealistic quality.'
  },
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'office',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в офисе в стильном деловом наряде - fitted professional clothing, elegant business attire. Confident professional pose. Убери предметы из рук и шеи. Professional attire only - NO inappropriate revealing. Sexy through style, confidence, posture. Use advanced upscaling. CRUCIAL: One seamless photo. Preserve skin micro-details. Premium photorealistic professional result.'
  }
];

async function updateHotPrompts() {
  console.log("🚀 Обновляем Hot промпты в БД...");
  console.log(`📊 Всего промптов: ${newHotPrompts.length}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const prompt of newHotPrompts) {
    const { model, intensity, environment } = prompt;
    console.log(`\n📝 Обновление: ${model} / ${intensity} / ${environment || 'null'}`);
    
    const { error } = await supabase
      .from('prompts')
      .update({ prompt_text: prompt.prompt_text, updated_at: new Date().toISOString() })
      .eq('model', model)
      .eq('intensity', intensity)
      .is('environment', environment);
    
    if (error) {
      console.error(`   ❌ Ошибка:`, error.message);
      errorCount++;
    } else {
      console.log(`   ✅ Успешно обновлен`);
      successCount++;
    }
  }
  
  console.log(`\n\n📊 Итоги:`);
  console.log(`   ✅ Успешно: ${successCount}`);
  console.log(`   ❌ Ошибок: ${errorCount}`);
  console.log(`\n🎉 Готово! Hot промпты теперь более мягкие и не раздевают.`);
}

updateHotPrompts().catch(console.error);
