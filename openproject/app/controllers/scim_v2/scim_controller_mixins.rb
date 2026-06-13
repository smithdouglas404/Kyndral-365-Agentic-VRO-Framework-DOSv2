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

module ScimV2
  module ScimControllerMixins
    def self.included(base)
      base.prepend(Overwrites)
    end

    module Overwrites
      # Completely overwriting authenticate method of Scimitar
      def authenticate
        if !EnterpriseToken.allows_to?(:scim_api) || !OpenProject::FeatureDecisions.scim_api_active?
          return handle_scim_error(Scimitar::AuthenticationError.new)
        end

        User.current = warden.authenticate!(scope: :scim_v2)

        # Only a ServiceAccount associated with a ScimClient can use SCIM Server API
        unless User.current.respond_to?(:service) && User.current.service.is_a?(ScimClient)
          handle_scim_error(Scimitar::AuthenticationError.new)
        end
      end

      private

      def warden
        request.env["warden"]
      end
    end
  end
end
