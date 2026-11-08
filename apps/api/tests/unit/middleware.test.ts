import test from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../../src/middleware/validate.middleware.js";
import { authorize } from "../../src/middleware/authorize.middleware.js";
import AppError from "../../src/common/errors/AppError.js";

test("validate middleware: passes valid body and assigns sanitized data", (t, done) => {
  const schema = z.object({
    name: z.string().trim(),
    age: z.number().min(18),
  });

  const middleware = validate(schema);
  const req = { body: { name: "  John Doe  ", age: 25 } } as Request;
  const res = {} as Response;

  middleware(req, res, (err) => {
    assert.equal(err, undefined);
    assert.equal(req.body.name, "John Doe");
    assert.equal(req.body.age, 25);
    done();
  });
});

test("validate middleware: catches invalid body and calls next(AppError)", (t, done) => {
  const schema = z.object({
    email: z.string().email("Invalid email"),
  });

  const middleware = validate(schema);
  const req = { body: { email: "not-an-email" } } as Request;
  const res = {} as Response;

  middleware(req, res, (err) => {
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 400);
    assert.equal(err.message, "Invalid email");
    done();
  });
});

test("validate middleware: validates custom source like params", (t, done) => {
  const schema = z.object({
    id: z.string().regex(/^\d+$/, "Must be numeric"),
  });

  const middleware = validate(schema, "params");
  const req = { params: { id: "abc" } } as unknown as Request;
  const res = {} as Response;

  middleware(req, res, (err) => {
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 400);
    assert.equal(err.message, "Must be numeric");
    done();
  });
});

test("authorize middleware: blocks unauthenticated requests with 401", (t, done) => {
  const middleware = authorize("ADMIN");
  const req = {} as Request;
  const res = {} as Response;

  middleware(req, res, (err) => {
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 401);
    assert.equal(err.message, "Authentication required");
    done();
  });
});

test("authorize middleware: blocks forbidden role with 403", (t, done) => {
  const middleware = authorize("ADMIN");
  const req = { user: { id: "1", role: "MEMBER" } } as unknown as Request;
  const res = {} as Response;

  middleware(req, res, (err) => {
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 403);
    assert.equal(err.message, "Forbidden");
    done();
  });
});

test("authorize middleware: allows authorized role", (t, done) => {
  const middleware = authorize("ADMIN", "MEMBER");
  const req = { user: { id: "1", role: "ADMIN" } } as unknown as Request;
  const res = {} as Response;

  middleware(req, res, (err) => {
    assert.equal(err, undefined);
    done();
  });
});
