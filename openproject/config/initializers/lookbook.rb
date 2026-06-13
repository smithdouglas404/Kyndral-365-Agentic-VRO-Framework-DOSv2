Rails.application.configure do
  next unless OpenProject::Configuration.lookbook_enabled?

  require "factory_bot"
  require "factory_bot_rails"

  # Re-define snapshot to avoid warnings
  YARD::Tags::Library.define_tag("Snapshot preview (unused)", :snapshot)
  config.lookbook.project_name = "OpenProject Lookbook"
  config.lookbook.project_logo = Rails.root.join("app/assets/images/icon_logo_white.svg").read
  config.lookbook.ui_favicon = Rails.root.join("app/assets/images/icon_logo.svg").read
  config.lookbook.page_paths = [Rails.root.join("lookbook/docs").to_s]

  config.lookbook.component_paths << Primer::ViewComponents::Engine.root.join("app/components").to_s
  config.view_component.preview_paths += [
    Rails.root.join("lookbook/previews").to_s,
    Primer::ViewComponents::Engine.root.join("previews").to_s
  ]

  # Show pages first, then previews
  config.lookbook.preview_inspector.sidebar_panels = %i[pages previews]
  # Show notes first, all other panels next
  config.lookbook.preview_inspector.drawer_panels = [:notes, "*"]
  config.lookbook.ui_theme = "blue"
end
