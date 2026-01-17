-- Создать таблицу для промптов
CREATE TABLE IF NOT EXISTS prompts (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  model TEXT NOT NULL,
  intensity TEXT NOT NULL,
  environment TEXT,
  
  prompt_text TEXT NOT NULL,
  
  UNIQUE(model, intensity, environment)
);

-- Вставить дефолтные промпты для ByteDance
INSERT INTO prompts (model, intensity, environment, prompt_text) VALUES
-- ByteDance Pretty
('bytedance', 'pretty', NULL, 'Make this woman naturally more beautiful. Preserve all skin texture details, natural freckles, beauty marks and skin imperfections - keep them visible. Enhance skin tone subtly, brighten eyes gently, add subtle glow. Keep her natural facial features and expressions. Skin must look like real human skin, not plastic or overly smooth.Keep body proportions Maintain original outfit. Remove any objects from hands and neck. Shot like iPhone 17 Pro Max. Photorealistic, natural, living appearance.'),

-- ByteDance Hot Original
('bytedance', 'hot', 'original', 'Transform this woman into a stunningly attractive version of herself. Keep original background. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, NOT plastic. Keep body proportions, enhanced features but natural looking. Keep face expressions and personality. Remove any objects from hands and neck. Photorealistic result with natural human skin texture. make this woman sexy, work with outfit to show tits and mark body lines'),

-- ByteDance Hot Home
('bytedance', 'hot', 'home', 'Transform this woman into a stunningly attractive version of herself в уютной домашней обстановке в откровенной домашней одежде - открытый халат или короткая сексуальная пижама. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.'),

-- ByteDance Hot Bathtub
('bytedance', 'hot', 'bathtub', 'Transform this woman into a stunningly attractive version of herself в красивой эстетичной ванной комнате в откровенном сексуальном нижнем белье. IMPORTANT: человек не должен находитсья в самой ванне или душевой кабинке. Убери любые предметы из рук и с шеи. Так как девушка в нижнем белье подчерни соски но их не должно быть видно только форма и очень аккуратно, они должны быть под бельем. . IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.'),

-- ByteDance Hot Bedroom
('bytedance', 'hot', 'bedroom', 'Transform this woman into a stunningly attractive version of herself в спальне на кровати в откровенном сексуальном нижнем белье, частично раздетой. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.'),

-- ByteDance Hot Office
('bytedance', 'hot', 'office', 'Transform this woman into a stunningly attractive version of herself в офисе в откровенной сексуальной деловой одежде - распахнутая рубашка или облегающее платье - откровенный наряд. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.'),

-- NanoBana Pretty
('nanobana', 'pretty', NULL, 'Enhance this woman to make her stunningly naturally beautiful. Use advanced neural upscaling. Preserve all authentic skin texture, micro-details, freckles and natural imperfections. Subtly brighten eyes, enhance skin tone naturally, add soft luminous glow. Maintain original facial features, expressions and body proportions. Keep outfit intact. Premium iPhone 17 Pro Max photography. Ultra photorealistic with living, breathing human skin texture. No plastic look.'),

-- NanoBana Hot Original
('nanobana', 'hot', 'original', 'Transform this woman into an absolutely stunning, enhanced version using advanced AI upscaling. Keep original background. CRUCIAL: Create ONE seamless professional photo - blend perfectly. Preserve micro skin details, texture, freckles, beauty marks. Enhance beauty significantly while keeping skin ultra-realistic and natural - NOT plastic. Maintain body proportions with enhanced definition. Keep facial personality. Remove hand/neck objects. Premium photorealistic result. Make her extremely attractive, work with her outfit styling to enhance her best features.'),

-- NanoBana Hot Home
('nanobana', 'hot', 'home', 'Transform this woman into a stunningly beautiful enhanced version of herself в уютной домашней обстановке в откровенной домашней одежде - открытый халат или короткая сексуальная пижама. Убери любые предметы из рук и с шеи.. Use advanced neural upscaling. CRUCIAL: One unified seamless professional photo - blend seamlessly with background. Preserve skin texture micro-details, freckles, natural marks. Enhance beauty while keeping ultra-realistic skin tone and appearance. Keep body proportions, enhanced but natural. Premium iPhone 17 Pro Max quality photorealistic render.'),

-- NanoBana Hot Bathtub
('nanobana', 'hot', 'bathtub', 'Transform this woman into a stunningly beautiful enhanced version of herself в красивой эстетичной ванной комнате в откровенном сексуальном нижнем белье. IMPORTANT: человек не должен находитсья в самой ванне или душевой кабинке. Убери любые предметы из рук и с шеи. Так как девушка в нижнем белье подчерни соски но их не должно быть видно только форма и очень аккуратно, они должны быть под бельем. . Use advanced neural upscaling. CRUCIAL: One unified seamless professional photo - blend seamlessly with background. Preserve skin texture micro-details, freckles, natural marks. Enhance beauty while keeping ultra-realistic skin tone and appearance. Keep body proportions, enhanced but natural. Premium iPhone 17 Pro Max quality photorealistic render.'),

-- NanoBana Hot Bedroom
('nanobana', 'hot', 'bedroom', 'Transform this woman into a stunningly beautiful enhanced version of herself в спальне на кровати в откровенном сексуальном нижнем белье, частично раздетой. Убери любые предметы из рук и с шеи.. Use advanced neural upscaling. CRUCIAL: One unified seamless professional photo - blend seamlessly with background. Preserve skin texture micro-details, freckles, natural marks. Enhance beauty while keeping ultra-realistic skin tone and appearance. Keep body proportions, enhanced but natural. Premium iPhone 17 Pro Max quality photorealistic render.'),

-- NanoBana Hot Office
('nanobana', 'hot', 'office', 'Transform this woman into a stunningly beautiful enhanced version of herself в офисе в откровенной сексуальной деловой одежде - распахнутая рубашка или облегающее платье - откровенный наряд. Убери любые предметы из рук и с шеи.. Use advanced neural upscaling. CRUCIAL: One unified seamless professional photo - blend seamlessly with background. Preserve skin texture micro-details, freckles, natural marks. Enhance beauty while keeping ultra-realistic skin tone and appearance. Keep body proportions, enhanced but natural. Premium iPhone 17 Pro Max quality photorealistic render.'),

-- Salsa (все окружения)
('salsa', 'salsa', 'original', 'Transform this woman into an extremely sexy, stunningly beautiful fully naked version в исходном окружении (не меняй фон), но полностью обнаженной.. skin texture with natural freckles and beauty marks - skin must look incredibly realistic and photorealistic like iPhone 17 Pro Max photography. Perfect enhanced body curves and proportions, beautifully toned and feminine. Perfect face and natural expression. Remove any objects from hands. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, soft skin tones. dont forget nipples make it phisicaly right on the place where they should be'),

('salsa', 'salsa', 'home', 'Transform this woman into an extremely sexy, stunningly beautiful fully naked version в спальне дома, полностью обнаженной, в сексуальной позе.. skin texture with natural freckles and beauty marks - skin must look incredibly realistic and photorealistic like iPhone 17 Pro Max photography. Perfect enhanced body curves and proportions, beautifully toned and feminine. Perfect face and natural expression. Remove any objects from hands. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, soft skin tones. dont forget nipples make it phisicaly right on the place where they should be'),

('salsa', 'salsa', 'bathtub', 'Transform this woman into an extremely sexy, stunningly beautiful fully naked version в ванной комнате в ванне, полностью обнаженной, показывая тело.. skin texture with natural freckles and beauty marks - skin must look incredibly realistic and photorealistic like iPhone 17 Pro Max photography. Perfect enhanced body curves and proportions, beautifully toned and feminine. Perfect face and natural expression. Remove any objects from hands. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, soft skin tones. dont forget nipples make it phisicaly right on the place where they should be'),

('salsa', 'salsa', 'bedroom', 'Transform this woman into an extremely sexy, stunningly beautiful fully naked version в спальне на кровати, полностью обнаженной, в соблазнительной позе.. skin texture with natural freckles and beauty marks - skin must look incredibly realistic and photorealistic like iPhone 17 Pro Max photography. Perfect enhanced body curves and proportions, beautifully toned and feminine. Perfect face and natural expression. Remove any objects from hands. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, soft skin tones. dont forget nipples make it phisicaly right on the place where they should be'),

('salsa', 'salsa', 'office', 'Transform this woman into an extremely sexy, stunningly beautiful fully naked version в офисе, полностью обнаженной, в сексуальной позе, показывая свое идеальное тело.. skin texture with natural freckles and beauty marks - skin must look incredibly realistic and photorealistic like iPhone 17 Pro Max photography. Perfect enhanced body curves and proportions, beautifully toned and feminine. Perfect face and natural expression. Remove any objects from hands. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, soft skin tones. dont forget nipples make it phisicaly right on the place where they should be');

-- Включить RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Public можно читать, только admin может писать
CREATE POLICY "Prompts are viewable by everyone"
  ON prompts FOR SELECT
  USING (true);

-- Вставить текущее время при обновлении
CREATE OR REPLACE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
