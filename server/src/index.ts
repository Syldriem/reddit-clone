import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session";
import { MyContext } from "./types";
import MongoStore from "connect-mongo";
import cors from "cors";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();
  app.set("trust proxy", true);
  app.set("Access-Control-Allow-Origin", "https://studio.apollographql.com");
  app.set("Access-Control-Allow-Origin", "http://localhost:3000/*");
  app.set("Access-Control-Allow-Credentials", true);
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: "qid",
      store: MongoStore.create({
        mongoUrl: "mongodb://localhost/27017",
        dbName: "lireddit",
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        sameSite: "none", // csrf
        secure: !__prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: "gheshgiewhgskg",
      resave: false,
    })
  );
  //

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    csrfPrevention: true,
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });
  await apolloServer.start();

  // const corsOptions = {
  //   credentials: true,
  //   origin: [
  //     "http://localhost:5000/graphql",
  //     "https://studio.apollographql.com",
  //     "http://localhost:3000",
  //     "http://localhost:3000/*",
  //   ],
  // };

  apolloServer.applyMiddleware({ app, cors: false }); //path: "/graphql"

  app.listen(5000, () => {
    console.log("server started on localhost:5000");
  });
  //const post = orm.em.create(Post, { title: "my first post" });
  //await orm.em.persistAndFlush(post);

  //   const posts = await orm.em.find(Post, {});
  //   console.log(posts);
};

main().catch((err) => {
  console.log("err:", err);
});
