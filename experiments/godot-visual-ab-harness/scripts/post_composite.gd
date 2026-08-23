extends Node2D

const HALF_RESOLUTION_SIZE: Vector2i = Vector2i(960, 540)

@onready var post_viewport: SubViewport = $HalfResolutionPostViewport
@onready var post_pass: Node2D = $HalfResolutionPostViewport/PostPass
@onready var composite_texture: TextureRect = $PostCompositeTexture

var controller: Node


func _ready() -> void:
	post_viewport.size = HALF_RESOLUTION_SIZE
	post_viewport.transparent_bg = true
	post_viewport.render_target_clear_mode = SubViewport.CLEAR_MODE_ALWAYS
	post_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	composite_texture.texture = post_viewport.get_texture()
	composite_texture.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	composite_texture.position = Vector2.ZERO
	composite_texture.size = Vector2(1920.0, 1080.0)


func bind_controller(value: Node) -> void:
	controller = value
	post_pass.call("bind_controller", value)


func refresh() -> void:
	post_pass.call("refresh")


func get_half_resolution_size() -> Vector2i:
	return post_viewport.size
