<template>
  <div>
  <div v-if="!(!homework.publish && !isTeacher)">
    <div v-if="homework !== undefined">
    <draggable v-model="homework.questions">
      <div class="card" v-for="(question, index) in homework.questions" :key="question.question">
        <el-card>
          <div class="title clearfix">
            <span class="questionTitle">{{question.question}}</span>
            <el-button v-if="isTeacher" @click="deleteQuestion(index)" style="float: right">删除</el-button>
          </div>
          <div v-if="question.solution !== undefined && question.choice" >
            <span>{{question.A}}</span>
            <input type="checkbox" v-model="question.solution.A">
            <span>{{question.B}}</span>
            <input type="checkbox" v-model="question.solution.B" >
            <span>{{question.C}}</span>
            <input type="checkbox" v-model="question.solution.C" >
            <span>{{question.D}}</span>
            <input type="checkbox" v-model="question.solution.D">
          </div>
          <div v-else-if="question.choice">
            <span>{{question.A}}</span>
            <input type="checkbox">
            <span>{{question.B}}</span>
            <input type="checkbox" >
            <span>{{question.C}}</span>
            <input type="checkbox" >
            <span>{{question.D}}</span>
            <input type="checkbox">
          </div>
          <textarea class="fixedSize" v-else></textarea>

        </el-card>
        <div class="padding">
        </div>
      </div>
    </draggable>
    </div>
    <div class="card">
      <div v-if="isTeacher">
        <div class="button">
          <el-button type="primary" @click="saveHomework()">保存</el-button>
        </div>
        <div class="button">
          <el-button type="primary" @click="publishHomework()">发布</el-button>
        </div>
      </div>

      <div class="button" v-else>
        <el-button type="primary" @click="sendAnswers()">提交</el-button>
      </div>
    </div>
  </div>
  <div v-else>
    <!--<p>教师尚未发布作业</p>-->
  </div>
</div>
</template>

<script>
  import draggable from 'vuedraggable'
  import _ from 'lodash'
  import EventBus from '../../../EventBus.js'
  import { mapGetters } from 'vuex'

  export default {
    name: 'homework',
    props: ['selectedNodeId'],
    stash: ['isTeacher', 'username'],
    components: {
      draggable
    },
    data () {
      return {
        check: true,
        homework: {publish: false, questions: []}
      }
    },
    computed: {
      ...mapGetters([
        'cur_treeId'
      ])
    },
    created () {
      let that = this
//      console.log('created: ', that.selectedNodeId)
      EventBus.$on('add_question', function (question) {
//        console.log(that.selectedNodeId)
        that.homework.questions.push(question)
//        console.log(that.selectedNodeId)
      })
    },

    async mounted () {
      let that = this
      try {
        let response = await that.$http.get(_.join([that.$stash.AWEB_SERVER_ADDR, 'tree', this.cur_treeId, 'node', that.selectedNodeId, 'homework'], '/'))
        that.homework = Object.assign({}, that.homework, response.data)
        if (!that.isTeacher) {
          _.forEach(that.homework.questions, function (question) {
            question.solution = {A: false, B: false, C: false, D: false}
          })
        }
      } catch (e) {
      }
//      setInterval(function () {
//        that.$forceUpdate()
//      }, 100)
    },

    methods: {
      deleteQuestion (index) {
        this.homework.questions.splice(index, 1)
      },
      async saveHomework () {
        let that = this
        try {
          let homeworkToSave = _.cloneDeep(that.homework)
          if (!that.isTeacher) {
            _.forEach(homeworkToSave.questions, function (question) {
              _.unset(question, 'solution')
            })
          }
          await that.$http.post(_.join([this.$stash.AWEB_SERVER_ADDR, 'tree', this.cur_treeId, 'node', that.selectedNodeId, 'homework'], '/'), homeworkToSave)
          that.$alert('保存成功！', '提示', {
            confirmButtonText: '确定',
            callback: action => {
            }
          })
        } catch (e) {
        }
      },
      async publishHomework () {
        this.homework.publish = true
        await this.saveHomework()
        this.$alert('发布成功！', '提示', {
          confirmButtonText: '确定',
          callback: action => {
          }
        })
      },
      async sendAnswers () {
        try {
          let hasSendedResponse = await this.$http.get(_.join([this.$stash.AWEB_SERVER_ADDR, 'tree', this.cur_treeId, 'node', this.selectedNodeId, 'answer', this.username, 'status'], '/'))
          let hasSendedData = hasSendedResponse.data
          let hasSended = hasSendedData.status
          if (hasSended) {
            this.$alert('不能重复提交！', '失败', {
              confirmButtonText: '确定',
              callback: action => {
//              this.$message({
//                type: 'info',
//                message: `action: ${ action }`
//              });
              }
            })
          } else {
            let answer = _.map(this.homework.questions, (q) => {
              let solutions = q.solution
              let resultArr = []
              _.forEach(solutions, (value, key) => {
                if (value === true) {
                  resultArr.push(key)
                }
              })
              return _.join(resultArr.sort(), '')
            })
            console.log(answer)
            await this.$http.post(_.join([this.$stash.AWEB_SERVER_ADDR, 'tree', this.cur_treeId, 'node', this.selectedNodeId, 'answer', this.username], '/'), {answer: answer})
            this.$alert('提交成功！', '提示', {
              confirmButtonText: '确定',
              callback: action => {
//              this.$message({
//                type: 'info',
//                message: `action: ${ action }`
//              });
              }
            })
          }
        } catch (e) {
        }
      }
    }
  }
</script>
<style scoped>
  div.card {
    width: 90%;
    margin-left: 5%;
  }

  div.card div.button {
    float: right;
    margin-right: 3%;
  }

  div.title {
    margin-bottom: 2%;
  }

  .clearfix:before,
  .clearfix:after {
    display: table;
    content: "";
  }
  .clearfix:after {
    clear: both
  }

  div.title span.questionTitle {
    font-size: 100%;
  }

  div.title .delete {
    float: right;
  }

  div.padding {
    height: 5%;
  }

  textarea.fixedSize {
    border-color: rgb(209,219,229);
    resize: None;
    width: 100%;
    height: 20%;
  }
</style>
