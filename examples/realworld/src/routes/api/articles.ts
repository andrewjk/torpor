/*
import * as articles from "@/lib/api/controllers/articlesController";
import * as comments from "@/lib/api/controllers/commentsController";
import * as validator from "@/lib/api/middleware/articlesValidator";
import * as auth from "@/lib/api/middleware/auth/authenticator";
import commentCreateValidator from "@/lib/api/middleware/commentsValidator/commentCreateValidator";
import { Router } from "express";

const router = Router();

router.get("/", auth.optionalAuthenticate, validator.articlesListValidator, articles.articlesList);

router.post("/", auth.authenticate, validator.articlesCreateValidator, articles.articlesCreate);

router.get("/feed", auth.authenticate, validator.articlesFeedValidator, articles.articlesFeed);

router.get("/:slug", auth.optionalAuthenticate, articles.articlesGet);

router.put("/:slug", auth.authenticate, validator.articlesUpdateValidator, articles.articlesUpdate);

router.delete("/:slug", auth.authenticate, articles.articlesDelete);

router.get("/:slug/comments", auth.optionalAuthenticate, comments.getComments);

router.post("/:slug/comments", auth.authenticate, commentCreateValidator, comments.createComment);

router.delete("/:slug/comments/:id([0-9]+)", auth.authenticate, comments.deleteComment);

router.post("/:slug/favorite", auth.authenticate, articles.articlesFavorite);

router.delete("/:slug/favorite", auth.authenticate, articles.articlesUnFavorite);

export default router;
*/
