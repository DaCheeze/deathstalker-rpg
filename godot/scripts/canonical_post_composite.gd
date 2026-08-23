extends Node2D

const HALF_RESOLUTION_SIZE := Vector2i(960, 540)
const DESIGN_SIZE := Vector2(1920.0, 1080.0)
const POST_SHADER_PATH := "res://shaders/canonical_full_scene_post.gdshader"

@onready var world_source_viewport: SubViewport = $"../WorldSourceViewport"
@onready var post_viewport: SubViewport = $HalfResolutionPostViewport
@onready var world_feed: TextureRect = $HalfResolutionPostViewport/WorldFeed
@onready var composite_texture: TextureRect = $PostCompositeTexture

var post_material: ShaderMaterial
var post_enabled := true
var diagnostic_mode := false


func _ready() -> void:
	world_source_viewport.size = HALF_RESOLUTION_SIZE
	world_source_viewport.render_target_clear_mode = SubViewport.CLEAR_MODE_ALWAYS
	world_source_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	post_viewport.size = HALF_RESOLUTION_SIZE
	post_viewport.render_target_clear_mode = SubViewport.CLEAR_MODE_ALWAYS
	post_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	world_feed.texture = world_source_viewport.get_texture()
	world_feed.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	world_feed.position = Vector2.ZERO
	world_feed.size = Vector2(HALF_RESOLUTION_SIZE)
	post_material = world_feed.material as ShaderMaterial
	post_material.set_shader_parameter("world_texture", world_source_viewport.get_texture())
	composite_texture.texture = post_viewport.get_texture()
	composite_texture.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	composite_texture.position = Vector2.ZERO
	composite_texture.size = DESIGN_SIZE


func bind_controller(_controller: Node) -> void:
	pass


func refresh() -> void:
	world_feed.queue_redraw()
	composite_texture.queue_redraw()


func set_post_enabled(value: bool) -> void:
	post_enabled = value
	composite_texture.texture = (
		post_viewport.get_texture()
		if post_enabled
		else world_source_viewport.get_texture()
	)
	composite_texture.queue_redraw()


func set_diagnostic_mode(value: bool) -> void:
	diagnostic_mode = value
	if post_material != null:
		post_material.set_shader_parameter("diagnostic_mode", diagnostic_mode)


func get_half_resolution_size() -> Vector2i:
	return post_viewport.size


func get_world_source_size() -> Vector2i:
	return world_source_viewport.size


func get_composite_size() -> Vector2:
	return composite_texture.size


func get_post_shader_path() -> String:
	if post_material == null or post_material.shader == null:
		return ""
	return post_material.shader.resource_path


func is_post_enabled() -> bool:
	return post_enabled


func is_diagnostic_mode() -> bool:
	return diagnostic_mode


func is_raw_bypass_bound() -> bool:
	if post_enabled or composite_texture.texture == null:
		return false
	return composite_texture.texture.get_rid() == world_source_viewport.get_texture().get_rid()


func has_true_world_feed() -> bool:
	if post_material == null or post_material.shader == null:
		return false
	if post_material.shader.resource_path != POST_SHADER_PATH:
		return false
	if world_feed.texture == null or composite_texture.texture == null:
		return false
	var shader_feed_value: Variant = post_material.get_shader_parameter("world_texture")
	if not shader_feed_value is Texture2D:
		return false
	var shader_feed := shader_feed_value as Texture2D
	return (
		world_feed.texture.get_rid() == world_source_viewport.get_texture().get_rid()
		and shader_feed.get_rid() == world_source_viewport.get_texture().get_rid()
		and composite_texture.texture.get_rid() == post_viewport.get_texture().get_rid()
		and world_feed.size == Vector2(HALF_RESOLUTION_SIZE)
		and composite_texture.size == DESIGN_SIZE
	)
