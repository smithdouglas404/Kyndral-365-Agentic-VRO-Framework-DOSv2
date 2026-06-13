# frozen_string_literal: true

#-- copyright
# OpenProject is an open source project management software.
# Copyright (C) the OpenProject GmbH
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See COPYRIGHT and LICENSE files for more details.
#++

module Storages
  class SharePointStorage < Storage
    # For now SharePoint is visible only in tests.
    # This is to prevent it from being shown in the UI, as it is not ready yet.
    def self.visible?
      Rails.env.test?
    end

    def self.short_provider_name = :share_point
    def audience = nil

    def authenticate_via_idp? = false

    def authenticate_via_storage? = true

    def available_project_folder_modes
      if automatic_management_enabled?
        ProjectStorage.project_folder_modes.keys
      else
        %w[inactive manual]
      end
    end

    def oauth_configuration = Adapters::Providers::SharePoint::OAuthConfiguration.new(self)

    # To implement
    # configuration_checks
    # automatic_management_new_record?
    # provider_fields_defaults
  end
end
