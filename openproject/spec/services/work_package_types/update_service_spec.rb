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

require "spec_helper"
require "services/shared_type_service"
require "services/base_services/behaves_like_update_service"

module WorkPackageTypes
  RSpec.describe UpdateService, type: :service do
    shared_let(:user) { create(:admin) }

    let(:model) { create(:type, name: "Types-R-Us") }
    let(:type) { model }
    let(:service_call) { service.call(params) }

    subject(:service) { described_class.new(user:, model:) }

    it_behaves_like "type service"

    it_behaves_like "BaseServices update service" do
      let(:factory) { :type }
      let(:model_class) { Type }
    end

    it "updates the attributes of the model" do
      params = { name: "updated name" }
      expect { service.call(params) }.to change(model, :name).from("Types-R-Us").to("updated name")

      expect(model).to be_valid
      expect(model.changes).to be_empty
    end

    it "defaults to the UpdateSettingsContract" do
      params = { patterns: { subject: { blueprint: "{{author}}", enabled: true } } }

      # NOTE: This still applies changes to the model... which is far from ideal - 2025-06-23 @mereghost
      result = service.call(params)
      expect(result).to be_failure
      expect(result.errors.full_messages).to be_present
    end
  end
end
