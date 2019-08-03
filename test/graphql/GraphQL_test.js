const TestHelper = require('../support/TestHelper');
const GraphQL = require('../../lib/helper/Graphql');
const server = require('../data/graphql/index');

const PORT = TestHelper.graphQLServerPort();
const path = require('path');
const fs = require('fs');

let I;
const dbFile = path.join(__dirname, '/../data/graphql/db.json');
require('co-mocha')(require('mocha'));

const data = {
  users: [
    {
      id: 0,
      age: 31,
      name: 'Peck Montoya',
      email: 'peckmontoya@qualitex.com',
    },
    {
      id: 1,
      age: 36,
      name: 'Renee Herman',
      email: 'reneeherman@qualitex.com',
    },
  ],
};

describe('GraphQL', () => {
  before((done) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
    setTimeout(done, 1500);
  });

  after((done) => {
    server.close();
    done();
  });

  beforeEach((done) => {
    I = new GraphQL({
      endpoint: `http://localhost:${PORT}/graphql`,
      defaultHeaders: {
        'X-Test': 'test',
      },
    });
    done();
  });

  describe('basic queries', () => {
    it('should send a query: read', () =>
      I.sendQuery({
        query: 'query { user(id: 1) { id name email }}',
      }).then((response) => {
        const { user } = response.data.data;
        user.should.eql({
          id: '1',
          name: 'Renee Herman',
          email: 'reneeherman@qualitex.com',
        });
      }));
  });

  describe('basic mutations', () => {
    it('should send a mutation: create', () => {
      const operation = {
        query: `
          mutation CreateUser($input: UserInput!) {
            createUser(input: $input) {
              id
              name
              email
              age
            }
          }
        `,
        variables: {
          input: {
            name: 'Sourab',
            email: 'sourab@mail.com',
            age: 23,
          },
        },
      };
      return I.sendMutation(operation).then((response) => {
        const { createUser } = response.data.data;
        createUser.should.eql({
          id: '2',
          name: 'Sourab',
          email: 'sourab@mail.com',
          age: 23,
        });
      });
    });

    it('should send a mutation: delete', () => {
      const operation = {
        query: `
          mutation deleteUser($id: ID) {
            deleteUser(id: $id)
          }
        `,
        variables: {
          id: 2,
        },
      };
      return I.sendMutation(operation).then((response) => {
        console.log(response.data);
        const { deleteUser } = response.data.data;
        deleteUser.should.eql('2');
      });
    });
  });
});
