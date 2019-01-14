"use strict";

const Database = use("Database");

const User = use("App/Models/User");
const Post = use("App/Models/Post");
const Question = use("App/Models/Question");
const QuestionVote = use("App/Models/QuestionVote");

class HomeController {
  async index({ view, request, session }) {
    const user = await User.query()
      .where("username", session.get("username"))
      .firstOrFail();

    const posts = await Post.query()
      .orderBy("id", "desc")
      .with("category")
      .with("poster")
      .with("likes")
      .with("comments")
      .paginate(Number(request.input("postpage", 1)), 8);

    var questions = await Question.query()
      .with("category")
      .with("poster")
      .with("upvotes", (builder) => {
        builder.where("user_id", user.id);
        builder.where("is_positive", true);
      })
      .with("downvotes", (builder) => {
        builder.where("user_id", user.id);
        builder.where("is_positive", false);
      })
      .with("answers.author")
      .orderBy("score", "desc")
      .paginate(Number(request.input("questionpage", 1)), 5);
    
    return view.render("home", {
      user: user.toJSON(),
      posts: posts.toJSON(),
      questions: questions.toJSON(),
      title: "Home"
    });
  }
}

module.exports = HomeController;
