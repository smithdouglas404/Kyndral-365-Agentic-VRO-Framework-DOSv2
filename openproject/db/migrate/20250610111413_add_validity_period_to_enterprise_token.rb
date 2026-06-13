# frozen_string_literal: true

class AddValidityPeriodToEnterpriseToken < ActiveRecord::Migration[8.0]
  def change
    change_table :enterprise_tokens, bulk: true do |table|
      table.column :valid_from, :date
      table.column :valid_until, :date

      table.index %i[valid_from valid_until]
    end
  end
end
