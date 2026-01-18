require('dotenv').config({ path: '.env.local' });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Ошибка: Не найдены переменные окружения NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const prompts = [
  // ByteDance Pretty
  {
    model: 'bytedance',
    intensity: 'pretty',
    environment: null,
    prompt_text: 'Make this woman naturally more beautiful. Preserve all skin texture details, natural freckles, beauty marks and skin imperfections - keep them visible. Enhance skin tone subtly, brighten eyes gently, add subtle glow. Keep her natural facial features and expressions. Skin must look like real human skin, not plastic or overly smooth. Keep body proportions. Maintain original outfit. Remove any objects from hands and neck. Shot like iPhone 17 Pro Max. Photorealistic, natural, living appearance.'
  },
  
  // ByteDance Hot Original
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'original',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself. Keep original background. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, NOT plastic. Keep body proportions, enhanced features but natural looking. Keep face expressions and personality. Remove any objects from hands and neck. Photorealistic result with natural human skin texture. Make this woman sexy, work with outfit to show tits and mark body lines.'
  },
  
  // ByteDance Hot Home
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'home',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в уютной домашней обстановке в откровенной домашней одежде - открытый халат или короткая сексуальная пижама. Убери любые предметы из рук и с шеи. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic, enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.'
  },
  
  // ByteDance Hot Bathtub
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'bathtub',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в красивой эстетичной ванной комнате в откровенном сексуальном нижнем белье. IMPORTANT: человек не должен находиться в самой ванне или душевой кабинке. Убери любые предметы из рук и с шеи. Так как девушка в нижнем белье подчеркни соски но их не должно быть видно только форма и очень аккуратно, они должны быть под бельем. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic, enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.'
  },
  
  // ByteDance Hot Bedroom
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'bedroom',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в спальне на кровати в откровенном сексуальном нижнем белье, частично раздетой. Убери любые предметы из рук и с шеи. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic, enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.'
  },
  
  // ByteDance Hot Office
  {
    model: 'bytedance',
    intensity: 'hot',
    environment: 'office',
    prompt_text: 'Transform this woman into a stunningly attractive version of herself в офисе в откровенной сексуальной деловой одежде - распахнутая рубашка или облегающее платье - откровенный наряд. Убери любые предметы из рук и с шеи. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic, enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.'
  },
  
  // NanoBana Pretty
  {
    model: 'nanobana',
    intensity: 'pretty',
    environment: null,
    prompt_text: 'Enhance this woman to make her stunningly naturally beautiful. Use advanced neural upscaling. Preserve all authentic skin texture, micro-details, freckles and natural imperfections. Subtly brighten eyes, enhance skin tone naturally, add soft luminous glow. Maintain original facial features, expressions and body proportions. Keep outfit intact. Premium iPhone 17 Pro Max photography. Ultra photorealistic with living, breathing human skin texture. No plastic look.'
  },
  
  // NanoBana Hot Original
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'original',
    prompt_text: 'Transform this woman into an absolutely stunning, enhanced version using advanced AI upscaling. Keep original background. CRUCIAL: Create ONE seamless professional photo - blend perfectly. Preserve micro skin details, texture, freckles, beauty marks. Enhance beauty significantly while keeping skin ultra-realistic and natural - NOT plastic. Maintain body proportions with enhanced definition. Keep facial personality. Remove hand/neck objects. Premium photorealistic result. Make her extremely attractive, work with her outfit styling to enhance her best features.'
  },
  
  // NanoBana Hot Home
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'home',
    prompt_text: 'Transform this woman into a stunningly beautiful enhanced version of herself в уютной домашней обстановке в откровенной домашней одежде - открытый халат или короткая сексуальная пижама. Убери любые предметы из рук и с шеи. Use advanced neural upscaling. CRUCIAL: One unified seamless professional photo - blend seamlessly with background. Preserve skin texture micro-details, freckles, natural marks. Enhance beauty while keeping ultra-realistic skin tone and appearance. Keep body proportions, enhanced but natural. Premium iPhone 17 Pro Max quality photorealistic render.'
  },
  
  // NanoBana Hot Bathtub
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'bathtub',
    prompt_text: 'Transform this woman into a stunningly beautiful enhanced version of herself в красивой эстетичной ванной комнате в откровенном сексуальном нижнем белье. IMPORTANT: человек не должен находиться в самой ванне или душевой кабинке. Убери любые предметы из рук и с шеи. Так как девушка в нижнем белье подчеркни соски но их не должно быть видно только форма и очень аккуратно, они должны быть под бельем. Use advanced neural upscaling. CRUCIAL: One unified seamless professional photo - blend seamlessly with background. Preserve skin texture micro-details, freckles, natural marks. Enhance beauty while keeping ultra-realistic skin tone and appearance. Keep body proportions, enhanced but natural. Premium iPhone 17 Pro Max quality photorealistic render.'
  },
  
  // NanoBana Hot Bedroom
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'bedroom',
    prompt_text: 'Transform this woman into a stunningly beautiful enhanced version of herself в спальне на кровати в откровенном сексуальном нижнем белье, частично раздетой. Убери любые предметы из рук и с шеи. Use advanced neural upscaling. CRUCIAL: One unified seamless professional photo - blend seamlessly with background. Preserve skin texture micro-details, freckles, natural marks. Enhance beauty while keeping ultra-realistic skin tone and appearance. Keep body proportions, enhanced but natural. Premium iPhone 17 Pro Max quality photorealistic render.'
  },
  
  // NanoBana Hot Office
  {
    model: 'nanobana',
    intensity: 'hot',
    environment: 'office',
    prompt_text: 'Transform this woman into a stunningly beautiful enhanced version of herself в офисе в откровенной сексуальной деловой одежде - распахнутая рубашка или облегающее платье - откровенный наряд. Убери любые предметы из рук и с шеи. Use advanced neural upscaling. CRUCIAL: One unified seamless professional photo - blend seamlessly with background. Preserve skin texture micro-details, freckles, natural marks. Enhance beauty while keeping ultra-realistic skin tone and appearance. Keep body proportions, enhanced but natural. Premium iPhone 17 Pro Max quality photorealistic render.'
  }
];

async function insertPrompts() {
  console.log("🚀 Начинаем вставку промптов в БД...");
  console.log(`📊 Всего промптов: ${prompts.length}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const prompt of prompts) {
    const { model, intensity, environment } = prompt;
    console.log(`\n📝 Вставка промпта: ${model} / ${intensity} / ${environment || 'null'}`);
    
    // Сначала проверим существует ли промпт
    const { data: existing } = await supabase
      .from('prompts')
      .select('id')
      .eq('model', model)
      .eq('intensity', intensity)
      .is('environment', environment)
      .single();
    
    if (existing) {
      console.log(`   ⚠️  Промпт уже существует, обновляем...`);
      const { error } = await supabase
        .from('prompts')
        .update({ prompt_text: prompt.prompt_text, updated_at: new Date().toISOString() })
        .eq('model', model)
        .eq('intensity', intensity)
        .is('environment', environment);
      
      if (error) {
        console.error(`   ❌ Ошибка обновления:`, error.message);
        errorCount++;
      } else {
        console.log(`   ✅ Успешно обновлен`);
        successCount++;
      }
    } else {
      const { error } = await supabase
        .from('prompts')
        .insert([prompt]);
      
      if (error) {
        console.error(`   ❌ Ошибка вставки:`, error.message);
        errorCount++;
      } else {
        console.log(`   ✅ Успешно добавлен`);
        successCount++;
      }
    }
  }
  
  console.log(`\n\n📊 Итоги:`);
  console.log(`   ✅ Успешно: ${successCount}`);
  console.log(`   ❌ Ошибок: ${errorCount}`);
  console.log(`\n🎉 Готово!`);
}

insertPrompts().catch(console.error);
