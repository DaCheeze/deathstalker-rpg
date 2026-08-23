extends Node2D

const TILE_SIZE := Vector2(640.0, 360.0)
const TITLES: Array[String] = [
	"01 STARFIELD",
	"02 FAR BACKDROP",
	"03 STAGE FLOOR",
	"04 ENEMY UNITS",
	"05 PARTY UNITS",
	"06 EMISSIVE PASS",
	"07 FOREGROUND",
	"08 BLOOM / GRADE / VIGNETTE",
	"09 UI / MENUS",
]
const CADENCE: Array[String] = [
	"CACHED",
	"CACHED",
	"CACHED / SHARP",
	"PER FRAME",
	"PER FRAME",
	"PER FRAME",
	"CACHED / SOFT PROXY",
	"PER FRAME / 960x540",
	"OUTSIDE POST",
]
const CYAN := Color("#63e6ff")
const GOLD := Color("#ffcf67")

var controller: Node


func bind_controller(value: Node) -> void:
	controller = value
	queue_redraw()


func refresh() -> void:
	queue_redraw()


func _draw() -> void:
	var snapshot := _snapshot()
	if snapshot.is_empty() or not bool(snapshot.get("diagnostic_compositor", false)):
		return
	var visibility := snapshot.get("layer_visibility", []) as Array
	var font := ThemeDB.fallback_font
	for layer_index in range(9):
		var column := layer_index % 3
		var row := layer_index / 3
		var origin := Vector2(float(column) * TILE_SIZE.x, float(row) * TILE_SIZE.y)
		var enabled := layer_index < visibility.size() and bool(visibility[layer_index])
		var edge := CYAN if enabled else Color("#f87171")
		draw_rect(Rect2(origin + Vector2(2.0, 2.0), TILE_SIZE - Vector2(4.0, 4.0)), Color(edge, 0.76), false, 3.0)
		draw_rect(Rect2(origin + Vector2(3.0, 3.0), Vector2(TILE_SIZE.x - 6.0, 39.0)), Color(0.003, 0.008, 0.020, 0.91))
		draw_string(font, origin + Vector2(17.0, 27.0), TITLES[layer_index], HORIZONTAL_ALIGNMENT_LEFT, 350.0, 15, Color.WHITE)
		draw_string(font, origin + Vector2(382.0, 27.0), CADENCE[layer_index], HORIZONTAL_ALIGNMENT_RIGHT, 238.0, 11, GOLD if enabled else Color("#fda4af"))
		if not enabled:
			draw_rect(Rect2(origin + Vector2(3.0, 42.0), Vector2(TILE_SIZE.x - 6.0, TILE_SIZE.y - 45.0)), Color(0.20, 0.02, 0.04, 0.53))
			draw_string(font, origin + Vector2(0.0, 210.0), "LAYER OFF", HORIZONTAL_ALIGNMENT_CENTER, TILE_SIZE.x, 24, Color("#fda4af"))
	draw_rect(Rect2(570.0, 1038.0, 780.0, 30.0), Color(0.003, 0.008, 0.020, 0.94))
	draw_string(font, Vector2(586.0, 1059.0), "D COMPOSITE  •  F1-F9 TOGGLE  •  F10 RESTORE  •  SAME BRIDGE SNAPSHOT / CONTACT TIME", HORIZONTAL_ALIGNMENT_CENTER, 748.0, 12, Color("#a7b3c4"))


func _snapshot() -> Dictionary:
	if controller == null or not controller.has_method("render_snapshot"):
		return {}
	var value: Variant = controller.call("render_snapshot")
	return value as Dictionary if value is Dictionary else {}
