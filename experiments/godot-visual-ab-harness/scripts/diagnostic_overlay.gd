extends Node2D

const DESIGN_SIZE: Vector2 = Vector2(1920.0, 1080.0)
const TILE_SIZE: Vector2 = Vector2(640.0, 360.0)
const UI_WHITE: Color = Color("#f8fafc")
const UI_MUTED: Color = Color("#a7b3c4")
const UI_CYAN: Color = Color("#63e6ff")
const UI_GOLD: Color = Color("#ffcf67")
const LAYER_TITLES: Array[String] = [
	"01 STARFIELD VOID",
	"02 FAR BACKDROP",
	"03 STAGE FLOOR",
	"04 ENEMY UNITS",
	"05 PARTY UNITS",
	"06 EMISSIVE PASS",
	"07 FOREGROUND OCCLUDERS",
	"08 BLOOM / GRADE / VIGNETTE",
	"09 UI / MENUS",
]
const LAYER_CADENCE: Array[String] = [
	"CACHED 480x270 SOFT SOURCE",
	"CACHED 960x540 IDENTICAL LOW-PASS",
	"CACHED SHARP STATIC",
	"PER-FRAME PRESENTATION",
	"PER-FRAME PRESENTATION",
	"PER-FRAME BLOOM SOURCE",
	"CACHED SOFT GEOMETRY",
	"PER-FRAME 960x540 POST VIEWPORT",
	"CANVASLAYER 100 / OUTSIDE POST",
]

var controller: Node


func bind_controller(value: Node) -> void:
	controller = value
	queue_redraw()


func refresh() -> void:
	queue_redraw()


func _draw() -> void:
	var state: Dictionary = _snapshot()
	if state.is_empty() or not bool(state.get("diagnostic_mosaic", false)):
		return
	var visibility_value: Variant = state.get("layer_visibility", [])
	var visibility: Array = visibility_value as Array if visibility_value is Array else []
	var font: Font = ThemeDB.fallback_font
	for layer_index: int in range(9):
		var column: int = layer_index % 3
		var row: int = layer_index / 3
		var tile_origin: Vector2 = Vector2(float(column) * TILE_SIZE.x, float(row) * TILE_SIZE.y)
		var tile_rect: Rect2 = Rect2(tile_origin, TILE_SIZE)
		var enabled: bool = layer_index < visibility.size() and bool(visibility[layer_index])
		draw_rect(tile_rect.grow(-2.0), Color(UI_CYAN if enabled else Color("#f87171"), 0.78), false, 3.0)
		draw_rect(Rect2(tile_origin + Vector2(2.0, 2.0), Vector2(TILE_SIZE.x - 4.0, 42.0)), Color(0.003, 0.008, 0.020, 0.92))
		draw_string(font, tile_origin + Vector2(17.0, 29.0), LAYER_TITLES[layer_index], HORIZONTAL_ALIGNMENT_LEFT, 360.0, 16, UI_WHITE)
		draw_string(font, tile_origin + Vector2(385.0, 28.0), LAYER_CADENCE[layer_index], HORIZONTAL_ALIGNMENT_RIGHT, 237.0, 11, UI_GOLD if enabled else Color("#fda4af"))
		if not enabled:
			draw_rect(Rect2(tile_origin + Vector2(2.0, 44.0), Vector2(TILE_SIZE.x - 4.0, TILE_SIZE.y - 46.0)), Color(0.20, 0.02, 0.04, 0.58))
			draw_string(font, tile_origin + Vector2(0.0, 212.0), "LAYER OFF", HORIZONTAL_ALIGNMENT_CENTER, TILE_SIZE.x, 27, Color("#fda4af"))
	draw_rect(Rect2(563.0, 1037.0, 794.0, 34.0), Color(0.003, 0.008, 0.020, 0.94))
	draw_string(font, Vector2(580.0, 1060.0), "D: RETURN TO COMPOSITE  •  F1-F9: TOGGLE  •  F10: RESTORE ALL  •  EXACT SAME FIXTURE/TIME", HORIZONTAL_ALIGNMENT_CENTER, 760.0, 12, UI_MUTED)


func _snapshot() -> Dictionary:
	if controller == null or not controller.has_method("render_snapshot"):
		return {}
	var snapshot_value: Variant = controller.call("render_snapshot")
	if snapshot_value is Dictionary:
		return snapshot_value as Dictionary
	return {}
