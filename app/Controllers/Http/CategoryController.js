"use strict";
const UserRepository = use("App/Repositories/UserRepository");
const PostRepository = use("App/Repositories/PostRepository");
const CategoryRepository = use("App/Repositories/CategoryRepository");

const Subscription = use("App/Models/Subscription");
const Question = use("App/Models/Question");

class CategoryController {
  async index({ view, request, params, session }) {
    const user = await UserRepository.get(session.get("username"));

    const posts = await PostRepository.getPostsByCategoryPaginated(
      params.category_id,
      request.input("page", 1),
      10
    );

    const questions = await Question.query()
      .with("category")
      .where("category_id", params.category_id)
      .with("poster")
      .with("upvotes", builder => {
        builder.where("user_id", user.id);
        builder.where("is_positive", true);
      })
      .with("downvotes", builder => {
        builder.where("user_id", user.id);
        builder.where("is_positive", false);
      })
      .with("answers.author")
      .orderBy("score", "desc")
      .paginate(Number(request.input("page", 1)), 10);

    const category = await CategoryRepository.get(params.category_id);

    const userIsSubscribed = await Subscription.query()
      .where("user_id", user.id)
      .where("category_id", params.category_id)
      .first();

    return view.render("home", {
      posts: posts.toJSON(),
      questions: questions.toJSON(),
      category: category.toJSON(),
      userIsSubscribed: userIsSubscribed ? true : false,
      title: category.name
    });
  }

  async subscribe({ request, response, session }) {
    const user = await UserRepository.get(session.get("username"));

    const existingSubscription = await Subscription.query()
      .where("user_id", user.id)
      .where("category_id", request.input("category_id"))
      .first();

    if (existingSubscription) {
      await Subscription.query()
        .where("user_id", user.id)
        .where("category_id", request.input("category_id"))
        .delete();

      session.flash({
        notification: {
          type: "danger",
          message: "You have been unsubscribed from this Category!"
        }
      });
    } else {
      const subscription = new Subscription();
      subscription.user_id = user.id;
      subscription.category_id = request.input("category_id");
      await user.subscriptions().save(subscription);

      session.flash({
        notification: {
          type: "success",
          message: "Category subscription added!"
        }
      });
    }

    var route = "/category/" + request.input("category_id");
    return response.route(route);
  }

  async subscriptions({ view, request, session }) {
    const user = await UserRepository.get(session.get("username"));

    const subscriptions = await Subscription.query()
      .where("user_id", user.id)
      .pluck("category_id");

    if (subscriptions.length > 0) {
      const posts = await PostRepository.getPostsByCategoriesPaginated(
        subscriptions,
        request.input("page", 1),
        10
      );

      const questions = await Question.query()
        .with("category")
        .whereIn("category_id", subscriptions)
        .with("poster")
        .with("upvotes", builder => {
          builder.where("user_id", user.id);
          builder.where("is_positive", true);
        })
        .with("downvotes", builder => {
          builder.where("user_id", user.id);
          builder.where("is_positive", false);
        })
        .with("answers.author")
        .orderBy("score", "desc")
        .paginate(Number(request.input("page", 1)), 10);

      return view.render("home", {
        posts: posts.toJSON(),
        questions: questions.toJSON(),
        message: "Subscribed"
      });
    } else {
      return view.render("home", {
        title: "My Subscriptions",
        message: "Subscribed"
      });
    }
  }
}

module.exports = CategoryController;
