extends SceneTree

const BridgeLoader = preload("res://scripts/presentation_bridge_loader.gd")
const FIXTURE_PATH := "res://data/presentation-replay-v1.json"


func _initialize() -> void:
	var loader := BridgeLoader.new()
	var bridge: Dictionary = loader.load_and_validate(FIXTURE_PATH)
	if bridge.is_empty():
		quit(1)
		return
	var frames := bridge.get("frames", []) as Array
	print(
		"[Godot Bridge Validator] PASS schema=v%d fixture=%s frames=%d authority=typescript-core"
		% [int(bridge.get("schemaVersion", 0)), str((bridge.get("source", {}) as Dictionary).get("fixtureId", "")), frames.size()]
	)
	quit(0)
