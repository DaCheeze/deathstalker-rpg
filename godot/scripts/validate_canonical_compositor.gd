extends SceneTree

const SCENE_PATH := "res://main.tscn"
const LAYER_SCRIPT_PATH := "res://scripts/canonical_compositor_layer.gd"
const POST_SCRIPT_PATH := "res://scripts/canonical_post_composite.gd"
const POST_SHADER_PATH := "res://shaders/canonical_full_scene_post.gdshader"
const DIAGNOSTIC_SCRIPT_PATH := "res://scripts/canonical_compositor_diagnostic.gd"
const HALF_SIZE := Vector2i(960, 540)
const DESIGN_SIZE := Vector2(1920.0, 1080.0)
const EXPECTED_NAMES: Array[String] = [
	"Layer01Starfield",
	"Layer02FarBackdrop",
	"Layer03StageFloor",
	"Layer04EnemyUnits",
	"Layer05PartyUnits",
	"Layer06EmissivePass",
	"Layer07ForegroundOccluders",
	"Layer08BloomGradeVignetteComposite",
	"Layer09UI",
]
const EXPECTED_GROUPS: Array[String] = [
	"compositor_layer_01_starfield",
	"compositor_layer_02_far_backdrop",
	"compositor_layer_03_stage_floor",
	"compositor_layer_04_enemy_units",
	"compositor_layer_05_party_units",
	"compositor_layer_06_emissive_pass",
	"compositor_layer_07_foreground_occluders",
	"compositor_layer_08_half_resolution_post",
	"compositor_layer_09_ui",
]


func _initialize() -> void:
	call_deferred("_run_validation")


func _run_validation() -> void:
	var packed_value: Variant = load(SCENE_PATH)
	if not packed_value is PackedScene:
		push_error("Canonical compositor validator could not load %s." % SCENE_PATH)
		quit(1)
		return
	var client := (packed_value as PackedScene).instantiate()
	client.set_script(null)
	get_root().add_child(client)
	await process_frame
	var failures := _validate_scene(client)
	client.free()
	if not failures.is_empty():
		for failure in failures:
			push_error("Canonical compositor contract: %s" % failure)
		quit(1)
		return
	print(
		"[Godot Compositor Validator] PASS layers=01>02>03>04>05>06>07 world_feed=960x540 sampled_by_post=true post=960x540 upscale=1920x1080 layer08_bypass=true ui=CanvasLayer100/outside-post."
	)
	quit(0)


func _validate_scene(client: Node) -> Array[String]:
	var failures: Array[String] = []
	if str(client.name) != "GodotPresentationClient":
		failures.append("root node name changed.")
	if client.get_child_count() != 3:
		failures.append("authored root must contain WorldSourceViewport, Layer08, and sibling Layer09UI.")
	var source_value := client.get_node_or_null("WorldSourceViewport")
	var post_value := client.get_node_or_null("Layer08BloomGradeVignetteComposite")
	var ui_value := client.get_node_or_null("Layer09UI")
	if not source_value is SubViewport:
		failures.append("WorldSourceViewport must be a SubViewport.")
		return failures
	if not post_value is Node2D:
		failures.append("Layer08 must be a sibling Node2D that samples the world viewport.")
		return failures
	if not ui_value is CanvasLayer:
		failures.append("Layer09UI must be a CanvasLayer sibling.")
		return failures
	var source := source_value as SubViewport
	var post := post_value as Node2D
	var ui := ui_value as CanvasLayer
	_validate_world_source(source, failures)
	_validate_post_node(source, post, failures)
	_validate_ui(post, ui, failures)
	return failures


func _validate_world_source(source: SubViewport, failures: Array[String]) -> void:
	if source.size != HALF_SIZE:
		failures.append("world source viewport must remain exactly 960x540.")
	if source.render_target_clear_mode != SubViewport.CLEAR_MODE_ALWAYS:
		failures.append("world source viewport must clear every frame.")
	if source.render_target_update_mode != SubViewport.UPDATE_ALWAYS:
		failures.append("world source viewport must update every frame.")
	var design_value := source.get_node_or_null("WorldDesignSurface")
	if not design_value is Node2D:
		failures.append("WorldDesignSurface must be a Node2D.")
		return
	var design := design_value as Node2D
	if design.scale != Vector2(0.5, 0.5):
		failures.append("WorldDesignSurface must scale design commands to the half-resolution source once.")
	var world := design.get_node_or_null("WorldComposition")
	if world == null:
		failures.append("WorldComposition is missing from the source viewport.")
		return
	if world.get_child_count() != 7:
		failures.append("WorldComposition must contain exactly seven ordered pre-post layers.")
	for layer_index in range(mini(7, world.get_child_count())):
		var layer := world.get_child(layer_index)
		if str(layer.name) != EXPECTED_NAMES[layer_index]:
			failures.append("layer %02d name is %s, expected %s." % [layer_index + 1, layer.name, EXPECTED_NAMES[layer_index]])
		if not layer.is_in_group("compositor_layer") or not layer.is_in_group(EXPECTED_GROUPS[layer_index]):
			failures.append("layer %02d is missing required groups." % (layer_index + 1))
		if not layer is Node2D:
			failures.append("layer %02d must be Node2D." % (layer_index + 1))
			continue
		if (layer as Node2D).z_index != layer_index:
			failures.append("layer %02d z_index must be %d." % [layer_index + 1, layer_index])
		_validate_renderer(layer, layer_index + 1, failures)


func _validate_post_node(
	source: SubViewport,
	post: Node2D,
	failures: Array[String]
) -> void:
	if str(post.name) != EXPECTED_NAMES[7]:
		failures.append("layer 08 name changed.")
	if not post.is_in_group("compositor_layer") or not post.is_in_group(EXPECTED_GROUPS[7]):
		failures.append("layer 08 is missing required groups.")
	if post.z_index != 7:
		failures.append("layer 08 z_index must equal 7.")
	if source.is_ancestor_of(post):
		failures.append("layer 08 must be outside its world-source viewport.")
	_validate_script_path(post, POST_SCRIPT_PATH, "layer 08", failures)
	var viewport_value := post.get_node_or_null("HalfResolutionPostViewport")
	var world_feed_value := post.get_node_or_null("HalfResolutionPostViewport/WorldFeed")
	var composite_value := post.get_node_or_null("PostCompositeTexture")
	if not viewport_value is SubViewport:
		failures.append("layer 08 requires its own half-resolution post viewport.")
		return
	var viewport := viewport_value as SubViewport
	if viewport.size != HALF_SIZE:
		failures.append("post viewport must remain exactly 960x540.")
	if viewport.render_target_clear_mode != SubViewport.CLEAR_MODE_ALWAYS:
		failures.append("post viewport must clear every frame.")
	if viewport.render_target_update_mode != SubViewport.UPDATE_ALWAYS:
		failures.append("post viewport must update every frame.")
	if not world_feed_value is TextureRect:
		failures.append("post viewport WorldFeed TextureRect is missing.")
		return
	if not composite_value is TextureRect:
		failures.append("layer 08 enlarged PostCompositeTexture is missing.")
		return
	var world_feed := world_feed_value as TextureRect
	var composite := composite_value as TextureRect
	if world_feed.size != Vector2(HALF_SIZE):
		failures.append("WorldFeed must sample at exactly 960x540.")
	if composite.size != DESIGN_SIZE:
		failures.append("post result must enlarge once to 1920x1080.")
	if not world_feed.material is ShaderMaterial:
		failures.append("WorldFeed must use a ShaderMaterial.")
	else:
		var material := world_feed.material as ShaderMaterial
		if material.shader == null or material.shader.resource_path != POST_SHADER_PATH:
			failures.append("WorldFeed must use the canonical full-scene post shader.")
	if not post.has_method("has_true_world_feed") or not bool(post.call("has_true_world_feed")):
		failures.append("post runtime binding does not sample the actual composed-world viewport.")
	post.call("set_post_enabled", false)
	if not post.has_method("is_raw_bypass_bound") or not bool(post.call("is_raw_bypass_bound")):
		failures.append("layer 08 bypass does not expose the raw composed-world texture.")
	post.call("set_post_enabled", true)
	if not bool(post.call("has_true_world_feed")):
		failures.append("re-enabling layer 08 did not restore the post-viewport output.")
	post.call("set_diagnostic_mode", true)
	if not post.has_method("is_diagnostic_mode") or not bool(post.call("is_diagnostic_mode")):
		failures.append("diagnostic mode did not reach the full-scene post material.")
	post.call("set_diagnostic_mode", false)


func _validate_ui(post: Node2D, ui: CanvasLayer, failures: Array[String]) -> void:
	if str(ui.name) != EXPECTED_NAMES[8]:
		failures.append("UI layer name changed.")
	if not ui.is_in_group("compositor_layer") or not ui.is_in_group(EXPECTED_GROUPS[8]):
		failures.append("layer 09 is missing required groups.")
	if ui.layer != 100:
		failures.append("UI CanvasLayer must remain at layer 100.")
	if post.is_ancestor_of(ui):
		failures.append("UI must remain outside the post-processing subtree.")
	var ui_renderer := ui.get_node_or_null("UIRenderer")
	if ui_renderer == null:
		failures.append("UIRenderer is missing.")
	else:
		_validate_renderer(ui_renderer, 9, failures)
	var diagnostic := ui.get_node_or_null("DiagnosticOverlay")
	if diagnostic == null:
		failures.append("DiagnosticOverlay is missing from Layer09UI.")
	else:
		_validate_script_path(diagnostic, DIAGNOSTIC_SCRIPT_PATH, "diagnostic overlay", failures)


func _validate_renderer(
	renderer: Node,
	expected_layer_number: int,
	failures: Array[String]
) -> void:
	_validate_script_path(
		renderer,
		LAYER_SCRIPT_PATH,
		"layer %02d renderer" % expected_layer_number,
		failures
	)
	if int(renderer.get("layer_number")) != expected_layer_number:
		failures.append("layer %02d renderer number does not match semantic order." % expected_layer_number)


func _validate_script_path(
	node: Node,
	expected_path: String,
	label: String,
	failures: Array[String]
) -> void:
	var script_value: Variant = node.get_script()
	if not script_value is Script or (script_value as Script).resource_path != expected_path:
		failures.append("%s must use %s." % [label, expected_path])
