extends RefCounted

const MANIFEST_PATH := "res://data/runtime-visual-assets-manifest-v1.json"
const EXPECTED_FORMAT := "deathstalker-godot-runtime-visual-assets"
const EXPECTED_SELECTION := "imperial-skirmish-choice-a"
const EXPECTED_LAYERS: Array[String] = ["far_backdrop", "stage_floor", "foreground_occluder"]
const EXPECTED_LAYER_NUMBERS := {
	"far_backdrop": 2,
	"stage_floor": 3,
	"foreground_occluder": 7,
}
const EXPECTED_ASSET_ROOT := "res://assets/environment/imperial/"
const DESIGN_SIZE := Vector2i(1920, 1080)
const WORLD_SIZE := Vector2i(960, 540)

var manifest: Dictionary = {}
var textures: Dictionary = {}
var source_metrics: Dictionary = {}
var validation_errors: Array[String] = []


func load_and_validate(verify_source_hashes: bool = true) -> bool:
	manifest.clear()
	textures.clear()
	source_metrics.clear()
	validation_errors.clear()
	_load_manifest()
	if manifest.is_empty():
		return false
	_validate_manifest_contract()
	if not validation_errors.is_empty():
		return false
	var layers := manifest.get("layers", {}) as Dictionary
	for layer_id: String in EXPECTED_LAYERS:
		var record_value: Variant = layers.get(layer_id)
		if not record_value is Dictionary:
			_fail("Runtime visual manifest is missing layer %s." % layer_id)
			continue
		_load_layer(layer_id, record_value as Dictionary, verify_source_hashes)
	return validation_errors.is_empty()


func texture_for(layer_id: String) -> Texture2D:
	var value: Variant = textures.get(layer_id)
	return value as Texture2D if value is Texture2D else null


func selection_id() -> String:
	return str(manifest.get("selectionId", ""))


func metrics_copy() -> Dictionary:
	return source_metrics.duplicate(true)


func errors_copy() -> Array[String]:
	return validation_errors.duplicate()


func _load_manifest() -> void:
	var file := FileAccess.open(MANIFEST_PATH, FileAccess.READ)
	if file == null:
		_fail("Missing runtime visual manifest: %s" % MANIFEST_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		_fail("Runtime visual manifest must parse as a JSON object.")
		return
	manifest = parsed as Dictionary


func _validate_manifest_contract() -> void:
	if str(manifest.get("format", "")) != EXPECTED_FORMAT:
		_fail("Runtime visual manifest format must be %s." % EXPECTED_FORMAT)
	if int(manifest.get("schemaVersion", 0)) != 1:
		_fail("Runtime visual manifest schemaVersion must be 1.")
	if str(manifest.get("selectionId", "")) != EXPECTED_SELECTION:
		_fail("Runtime visual selection must remain %s." % EXPECTED_SELECTION)
	if _array_to_vector2i(manifest.get("referenceViewport", [])) != DESIGN_SIZE:
		_fail("Runtime visual referenceViewport must remain 1920x1080.")
	if _array_to_vector2i(manifest.get("worldCompositeViewport", [])) != WORLD_SIZE:
		_fail("Runtime visual worldCompositeViewport must remain 960x540.")
	var approval_value: Variant = manifest.get("approval")
	if not approval_value is Dictionary:
		_fail("Runtime visual manifest requires an approval record.")
	else:
		var approval := approval_value as Dictionary
		if str(approval.get("state", "")) != "developer_selected" or str(approval.get("sourceChoice", "")) != "A":
			_fail("Runtime visual approval must remain developer-selected source choice A.")
	var layers_value: Variant = manifest.get("layers")
	if not layers_value is Dictionary:
		_fail("Runtime visual manifest layers must be an object.")
		return
	var layers := layers_value as Dictionary
	if layers.size() != EXPECTED_LAYERS.size():
		_fail("Runtime visual manifest must declare exactly three authored layers.")


func _load_layer(layer_id: String, record: Dictionary, verify_source_hashes: bool) -> void:
	if int(record.get("compositorLayer", 0)) != int(EXPECTED_LAYER_NUMBERS[layer_id]):
		_fail("Runtime visual layer %s has the wrong compositor layer." % layer_id)
	var path := str(record.get("path", ""))
	if not path.begins_with(EXPECTED_ASSET_ROOT) or not path.ends_with(".png") or path.contains(".."):
		_fail("Runtime visual layer %s has an unsafe asset path: %s" % [layer_id, path])
		return
	if not ResourceLoader.exists(path, "Texture2D"):
		_fail("Missing runtime visual texture: %s" % path)
		return
	var resource: Resource = ResourceLoader.load(path, "Texture2D")
	if not resource is Texture2D:
		_fail("Runtime visual asset did not load as Texture2D: %s" % path)
		return
	var texture := resource as Texture2D
	var dimensions := Vector2i(texture.get_width(), texture.get_height())
	if _array_to_vector2i(record.get("expectedDimensions", [])) != DESIGN_SIZE or dimensions != DESIGN_SIZE:
		_fail("Runtime visual texture must remain 1920x1080: %s" % path)
	var expected_hash := str(record.get("sha256", "")).to_upper()
	if expected_hash.length() != 64:
		_fail("Runtime visual layer %s requires a 64-character SHA-256." % layer_id)
	var metrics := {
		"path": path,
		"sha256": expected_hash,
		"width": dimensions.x,
		"height": dimensions.y,
		"source_hash_verified": false,
	}
	if verify_source_hashes:
		_validate_source_image(layer_id, record, path, expected_hash, metrics)
	textures[layer_id] = texture
	source_metrics[layer_id] = metrics


func _validate_source_image(
	layer_id: String,
	record: Dictionary,
	path: String,
	expected_hash: String,
	metrics: Dictionary
) -> void:
	var actual_hash := FileAccess.get_sha256(path).to_upper()
	if actual_hash != expected_hash:
		_fail("Runtime visual source hash mismatch for %s: expected %s, received %s" % [path, expected_hash, actual_hash])
		return
	var image := Image.new()
	var result := image.load(ProjectSettings.globalize_path(path))
	if result != OK:
		_fail("Could not decode runtime visual source %s (error %d)." % [path, result])
		return
	var expected_alpha := str(record.get("expectedAlpha", ""))
	if expected_alpha == "none_opaque_rgb8":
		if image.get_format() != Image.FORMAT_RGB8:
			_fail("Authored far backdrop must decode as opaque RGB8: %s" % path)
	elif expected_alpha == "straight_rgba8_with_transparency":
		if image.get_format() != Image.FORMAT_RGBA8:
			_fail("Authored layer must decode as RGBA8: %s" % path)
		else:
			var alpha_range := _rgba8_alpha_range(image)
			if alpha_range != Vector2i(0, 255):
				_fail("Authored transparent layer must contain alpha 0 and 255: %s" % path)
	else:
		_fail("Runtime visual layer %s has an unsupported alpha contract." % layer_id)
	metrics["source_hash_verified"] = true
	metrics["format"] = image.get_format()


func _rgba8_alpha_range(image: Image) -> Vector2i:
	var bytes := image.get_data()
	var alpha_min := 255
	var alpha_max := 0
	for byte_index: int in range(3, bytes.size(), 4):
		var alpha := int(bytes[byte_index])
		alpha_min = mini(alpha_min, alpha)
		alpha_max = maxi(alpha_max, alpha)
	return Vector2i(alpha_min, alpha_max)


func _array_to_vector2i(value: Variant) -> Vector2i:
	if value is Array:
		var components := value as Array
		if components.size() == 2:
			return Vector2i(int(components[0]), int(components[1]))
	return Vector2i(-1, -1)


func _fail(message: String) -> void:
	if not validation_errors.has(message):
		validation_errors.append(message)
	push_error("[Runtime Visual Assets] %s" % message)
