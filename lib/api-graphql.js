const { KhanAPIWrapper } = require("./api-base")

const KhanAPIWrapperGraphQLMixin = SuperClass =>
  class extends SuperClass {
    /* These are endpoints that go with /api/internal. They are currently
     * undocumented, so any contributions and documentation are welcome.
     */

    async graphqlProgressByStudent(classId) {
      const payload = {
        query: `query ProgressByStudent($assignmentFilters: CoachAssignmentFilters, $contentKinds: [LearnableContentKind], $classId: String!, $pageSize: Int, $after: ID) {
  coach {
    id
    studentList(id: $classId) {
      id
      cacheId
      studentKaidsAndNicknames {
        id
        coachNickname
        __typename
      }
      assignmentsPage(filters: $assignmentFilters, after: $after, pageSize: $pageSize) {
        assignments(contentKinds: $contentKinds) {
          id
          dueDate
          contents {
            id
            translatedTitle
            kind
            defaultUrlPath
            __typename
          }
          itemCompletionStates {
            completedOn
            studentKaid
            bestScore {
              numAttempted
              numCorrect
              __typename
            }
            __typename
          }
          __typename
        }
        pageInfo {
          nextCursor
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}
`,
        variables: {
          classId,
          assignmentFilters: {
            dueAfter: null,
            dueBefore: null,
          },
          contentKinds: null,
          after: null,
          pageSize: 1000,
        },
        operationName: "ProgressByStudent",
      }

      return await this.fetchResource(
        "/api/internal/graphql",
        true,
        "POST",
        null,
        payload
      )
    }
  }

module.exports = {
  KhanAPIWrapperGraphQLMixin,
  KhanAPIWrapperGraphQL: KhanAPIWrapperGraphQLMixin(KhanAPIWrapper),
}
