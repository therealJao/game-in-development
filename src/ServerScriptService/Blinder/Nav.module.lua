-- BLINDER :: navegação própria (grade + A* + suavização)
-- Gera uma grade de nós sobre o chão do mapa, descarta nós dentro de obstáculos,
-- liga vizinhos com linha livre e calcula caminhos com A*. Funciona em qualquer mapa.
local Nav = {}
Nav.__index = Nav

local STEP = 4
local CLEAR_RADIUS = 1.3     -- folga lateral do monstro
local SCAN_HEIGHT = 2.6      -- altura (acima do chão) em que checamos obstáculos

local function key(ix: number, iz: number) return ix * 100003 + iz end

function Nav.build(map: Model)
	local self = setmetatable({}, Nav)
	self.map = map
	local rp = RaycastParams.new()
	rp.FilterType = Enum.RaycastFilterType.Include
	rp.FilterDescendantsInstances = { map }
	rp.RespectCanCollide = true
	self.rp = rp
	local op = OverlapParams.new()
	op.FilterType = Enum.RaycastFilterType.Include
	op.FilterDescendantsInstances = { map }
	op.RespectCanCollide = true

	local cf, size = map:GetBoundingBox()
	local minX, maxX = cf.Position.X - size.X / 2, cf.Position.X + size.X / 2
	local minZ, maxZ = cf.Position.Z - size.Z / 2, cf.Position.Z + size.Z / 2
	local topY = cf.Position.Y + size.Y / 2 + 2

	self.nodes = {}       -- id -> { pos, ix, iz, nb = {ids} }
	self.byKey = {}       -- key -> id
	local count = 0
	for ix = math.ceil(minX / STEP), math.floor(maxX / STEP) do
		for iz = math.ceil(minZ / STEP), math.floor(maxZ / STEP) do
			local x, z = ix * STEP, iz * STEP
			-- acha o chão (ignora teto: começa abaixo do teto procurando de cima)
			local hit = workspace:Raycast(Vector3.new(x, 13, z), Vector3.new(0, -30, 0), rp)
			if hit and hit.Normal.Y > 0.7 then
				local fy = hit.Position.Y
				local parts = workspace:GetPartBoundsInBox(CFrame.new(x, fy + 3.6, z), Vector3.new(2.6, 5.6, 2.6), op)
				if #parts == 0 then
					count += 1
					self.nodes[count] = { pos = Vector3.new(x, fy, z), ix = ix, iz = iz, nb = {} }
					self.byKey[key(ix, iz)] = count
				end
			end
		end
	end
	self.count = count
	-- arestas (8 direções, diagonal só se as duas ortogonais existirem)
	for id, n in ipairs(self.nodes) do
		for dx = -1, 1 do
			for dz = -1, 1 do
				if not (dx == 0 and dz == 0) then
					local other = self.byKey[key(n.ix + dx, n.iz + dz)]
					if other and other > id then
						local ok = true
						if dx ~= 0 and dz ~= 0 then
							ok = self.byKey[key(n.ix + dx, n.iz)] ~= nil and self.byKey[key(n.ix, n.iz + dz)] ~= nil
						end
						local o = self.nodes[other]
						if ok and math.abs(o.pos.Y - n.pos.Y) < 2 and self:clearFloor(n.pos, o.pos) then
							table.insert(n.nb, other)
							table.insert(o.nb, id)
						end
					end
				end
			end
		end
	end
	-- mantém só o maior componente conectado (descarta bolsos isolados atrás de móveis e áreas externas)
	local comp, best, bestSize = {}, 0, 0
	local c = 0
	for id in ipairs(self.nodes) do
		if not comp[id] then
			c += 1
			local q, size = { id }, 0
			comp[id] = c
			while #q > 0 do
				local x = table.remove(q)
				size += 1
				for _, nb in ipairs(self.nodes[x].nb) do
					if not comp[nb] then comp[nb] = c; table.insert(q, nb) end
				end
			end
			if size > bestSize then best, bestSize = c, size end
		end
	end
	for id, n in ipairs(self.nodes) do
		if comp[id] ~= best then
			n.dead = true
			self.byKey[key(n.ix, n.iz)] = nil
		end
	end
	self.alive = bestSize
	return self
end

-- linha livre entre dois pontos no CHÃO (y = piso)
function Nav:clearFloor(a: Vector3, b: Vector3): boolean
	local a2 = Vector3.new(a.X, a.Y + SCAN_HEIGHT, a.Z)
	local b2 = Vector3.new(b.X, a.Y + SCAN_HEIGHT, b.Z)
	local d = b2 - a2
	if d.Magnitude < 0.05 then return true end
	return workspace:Spherecast(a2, CLEAR_RADIUS, d, self.rp) == nil
end

-- nó visível mais próximo de um ponto (pos no chão)
function Nav:nearest(p: Vector3): number?
	local ix0, iz0 = math.floor(p.X / STEP + 0.5), math.floor(p.Z / STEP + 0.5)
	local best, bd = nil, math.huge
	for r = 0, 4 do
		for dx = -r, r do
			for dz = -r, r do
				if math.max(math.abs(dx), math.abs(dz)) == r then
					local id = self.byKey[key(ix0 + dx, iz0 + dz)]
					if id then
						local n = self.nodes[id]
						local d = (Vector3.new(n.pos.X, 0, n.pos.Z) - Vector3.new(p.X, 0, p.Z)).Magnitude
						if d < bd and (r <= 1 or self:clearFloor(Vector3.new(p.X, n.pos.Y, p.Z), n.pos)) then best, bd = id, d end
					end
				end
			end
		end
		if best and r >= 1 then break end
	end
	return best
end

function Nav:randomNode(): Vector3?
	if self.count == 0 then return nil end
	for _ = 1, 40 do
		local n = self.nodes[math.random(self.count)]
		if not n.dead and #n.nb >= 5 then return n.pos end
	end
	return nil
end

-- heap binária simples
local function push(h, id, f)
	h.n += 1
	local i = h.n
	h.ids[i] = id; h.fs[i] = f
	while i > 1 do
		local p = i // 2
		if h.fs[p] <= h.fs[i] then break end
		h.ids[p], h.ids[i] = h.ids[i], h.ids[p]
		h.fs[p], h.fs[i] = h.fs[i], h.fs[p]
		i = p
	end
end
local function pop(h)
	if h.n == 0 then return nil end
	local top = h.ids[1]
	h.ids[1] = h.ids[h.n]; h.fs[1] = h.fs[h.n]
	h.ids[h.n] = nil; h.fs[h.n] = nil
	h.n -= 1
	local i = 1
	while true do
		local l, r = i * 2, i * 2 + 1
		local s = i
		if l <= h.n and h.fs[l] < h.fs[s] then s = l end
		if r <= h.n and h.fs[r] < h.fs[s] then s = r end
		if s == i then break end
		h.ids[s], h.ids[i] = h.ids[i], h.ids[s]
		h.fs[s], h.fs[i] = h.fs[i], h.fs[s]
		i = s
	end
	return top
end

-- caminho do ponto A ao B (posições no chão). Retorna lista de Vector3 já suavizada.
function Nav:path(fromFloor: Vector3, toFloor: Vector3): { Vector3 }?
	local s, g = self:nearest(fromFloor), self:nearest(toFloor)
	if not s or not g then return nil end
	local nodes = self.nodes
	local goalPos = nodes[g].pos
	local gScore = { [s] = 0 }
	local came = {}
	local closed = {}
	local heap = { n = 0, ids = {}, fs = {} }
	push(heap, s, (nodes[s].pos - goalPos).Magnitude)
	local found = false
	local iter = 0
	while heap.n > 0 do
		iter += 1
		if iter > 6000 then break end
		local cur = pop(heap)
		if cur == g then found = true; break end
		if not closed[cur] then
			closed[cur] = true
			local cp = nodes[cur].pos
			for _, nb in ipairs(nodes[cur].nb) do
				if not closed[nb] then
					local np = nodes[nb].pos
					local tentative = gScore[cur] + (np - cp).Magnitude + (#nodes[nb].nb < 8 and 1.5 or 0) -- prefere longe das paredes
					if gScore[nb] == nil or tentative < gScore[nb] then
						gScore[nb] = tentative
						came[nb] = cur
						push(heap, nb, tentative + (np - goalPos).Magnitude)
					end
				end
			end
		end
	end
	if not found then return nil end
	local raw = {}
	local c = g
	while c do table.insert(raw, 1, nodes[c].pos); c = came[c] end
	table.insert(raw, toFloor)
	-- suavização (string pulling)
	local out = {}
	local anchor = fromFloor
	local i = 1
	while i <= #raw do
		local far = i
		for j = math.min(#raw, i + 14), i, -1 do
			if self:clearFloor(anchor, raw[j]) then far = j; break end
		end
		table.insert(out, raw[far])
		anchor = raw[far]
		i = far + 1
	end
	return out
end

return Nav
