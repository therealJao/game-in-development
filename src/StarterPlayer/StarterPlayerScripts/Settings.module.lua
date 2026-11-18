-- BLINDER :: configurações locais do jogador
local S = {
	music = 0.8,   -- volume de música (0..1)
	sfx = 1.0,     -- volume de efeitos (0..1)
	fov = 72,      -- campo de visão
	bob = true,    -- balanço da câmera
	shake = 1.0,   -- intensidade dos tremores
	grain = true,  -- granulado de filme
}
S.Changed = Instance.new("BindableEvent")
function S.set(key: string, value)
	S[key] = value
	S.Changed:Fire(key, value)
end
return S
