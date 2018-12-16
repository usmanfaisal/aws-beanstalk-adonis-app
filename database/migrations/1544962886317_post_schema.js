"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class PostSchema extends Schema {
  up() {
    this.create("posts", table => {
      table.increments();

      table
        .integer("user_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("cascade");

      table
        .integer("category_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("cascade");

      table.string("text");

      table.string("url").notNullable();

      table.timestamps();
    });
  }

  down() {
    this.drop("posts");
  }
}

module.exports = PostSchema;
