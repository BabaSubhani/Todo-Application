const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const intilizationOfDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3002, () => {
      console.log("The server is running http://localhost:3002/");
    });
  } catch (e) {
    console.log(`The error is ${e.message}`);
    process.exit(1);
  }
};

intilizationOfDb();

const formatDate = () => {
  return format(new Date(2021, 4, 04), "yyyy/MM/dd");
};
const result = formatDate();
console.log(result);

const convertResultResponseObj = (item) => {
  return {
    id: item.id,
    todo: item.todo,
    priority: item.priority,
    status: item.status,
    category: item.category,
    dueDate: item.due_date,
  };
};

const havePriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const havePriorityAndCategoryProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const haveStatusAndCategoryProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const havePriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const haveStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const haveCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const haveSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";

  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case havePriorityAndCategoryProperty(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          priority = '${priority}'
          AND category = '${category}';
      `;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) => convertResultResponseObj(eachItem))
          );
        } else {
          response.status(400).send(" Invalid Todo Category");
        }
      } else {
        response.status(400).send(" Invalid Todo Priority");
      }
      break;

    case havePriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          priority = '${priority}'
          AND status = '${status}';
      `;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) => convertResultResponseObj(eachItem))
          );
        } else {
          response.status(400).send("Invalid Todo Status");
        }
      } else {
        response.status(400).send("Invalid Todo Priority");
      }
      break;

    case haveStatusAndCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          category = '${category}'
          AND status = '${status}';
      `;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) => convertResultResponseObj(eachItem))
          );
        } else {
          response.status(400).send("Invalid Todo Status");
        }
      } else {
        response.status(400).send("Invalid Todo Category");
      }
      break;

    case haveSearchProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%';
      `;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => convertResultResponseObj(eachItem)));
      break;

    case haveCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
           category = '${category}';
      `;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) => convertResultResponseObj(eachItem))
        );
      } else {
        response.status(400).send("Invalid Todo Category");
      }
      break;
    case haveStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
           status = '${status}';
      `;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) => convertResultResponseObj(eachItem))
        );
      } else {
        response.status(400).send("Invalid Status Property");
      }
      break;

    case havePriorityProperty(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
           priority = '${priority}';
      `;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) => convertResultResponseObj(eachItem))
        );
        break;
      } else {
        response.status(400).send("Invalid Todo Priority");
      }
    default:
      getTodosQuery = `
        SELECT
          *
        FROM
          todo;
      `;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => convertResultResponseObj(eachItem)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};
  `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const agendaQuery = `SELECT * FROM todo
                            WHERE due_date = '${newDate}';`;

    const agendaRes = await db.all(agendaQuery);
    console.log(agendaRes);
    response.send(agendaRes.map((item) => convertResultResponseObj(item)));
  } else {
    response.status(400).send("Invalid due_date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");

          const postTodoQuery = `INSERT INTO todo (id, todo, category, priority, status, due_date)
            VALUES (${id}, '${todo}', '${category}', '${priority}', '${status}', '${postNewDueDate}');`;

          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = requestBody;

  let updateTodoQuery;

  switch (true) {
    // Update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // Update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    // Update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${newDueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};
  `;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
