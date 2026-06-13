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

class Projects::IdentifierController < ApplicationController
  include OpTurbo::ComponentStream
  include OpTurbo::FlashStreamHelper

  before_action :find_project_by_project_id
  before_action :authorize

  def show
    respond_with_dialog Projects::ChangeIdentifierDialogComponent.new(project: @project)
  end

  def check
    @project.identifier = params.require(:value)
    validators = Project.validators_on(:identifier)
    validators.each { |validator| validator.validate(@project) }

    if @project.errors[:identifier].any?
      render status: :unprocessable_entity, plain: @project.errors.full_messages_for(:identifier).join(" ")
    else
      head :ok
    end
  end

  def update
    service_call = Projects::UpdateService
                     .new(user: current_user,
                          model: @project)
                     .call(identifier: permitted_params.project[:identifier])

    if service_call.success?
      flash[:notice] = I18n.t(:notice_successful_update)
      redirect_to project_settings_general_path(@project)
    else
      message = t(:notice_unsuccessful_update_with_reason, reason: service_call.message)
      respond_with_flash_error(message:)
    end
  end
end
