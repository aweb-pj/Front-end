<template>
  <div>
    <div v-if="files !== undefined && files.length > 0">
      <draggable v-model="files" v-if="isTeacher">
        <div @click="openFrame(file)" v-for="(file, index) in files" :key="file">
          <el-card>
            <span>{{file}}</span>
            <el-button @click="deleteFile(index, $event)" style="float: right">删除</el-button>
          </el-card>
        </div>
      </draggable>
      <div v-else>
        <div @click="openFrame(file)" v-for="(file, index) in files" :key="file">
          <el-card>
            <span>{{file}}</span>
            <el-button @click="deleteFile(index, $event)" v-if="isTeacher" style="float: right">删除</el-button>
          </el-card>
        </div>
      </div>
    </div>
    <div v-else-if="!isTeacher">
      <!--<p>教师尚未上传课件</p>-->
    </div>
    <div>
      <el-upload
          v-if="isTeacher"
          class="upload-demo"
          drag
          :action="file_server_addr"
          :on-success="afterSuccessing"	>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </el-upload>
    </div>
    <el-dialog title="资源" v-model="dialogVisible" size="large">
      <iframe class="frame" :src="viewURL">
      </iframe>
    </el-dialog>
  </div>
</template>
<script>
  import draggable from 'vuedraggable'
  import _ from 'lodash'
  import { mapGetters } from 'vuex'

  export default {
    name: 'material',
    props: ['selectedNodeId'],
    stash: ['isTeacher'],
    components: {
      draggable
    },
    data () {
      return {
        dialogVisible: false,
        form: {
          name: '',
          region: '',
          date1: '',
          date2: '',
          delivery: false,
          type: [],
          resource: '',
          desc: ''
        },
        selectedFile: ''
      }
    },
    async mounted () {
      await this.$store.dispatch('get_material', this.selectedNodeId)
    },
    computed: {
      ...mapGetters([
        'cur_treeId'
      ]),
      file_server_addr () {
        return _.join([this.$stash.AWEB_SERVER_ADDR, 'tree', this.cur_treeId, 'node', this.selectedNodeId, 'material'], '/')
      },
      files: {
        get () {
          try {
            return this.$store.state.material[this.selectedNodeId]
          } catch (e) {
            return []
          }
        },
        set (files) {
          this.$store.dispatch('update_files', {nodeId: this.selectedNodeId, files: files})
        }
      },
      viewURL: function () {
        let that = this
        let serverUrl = _.join([that.$stash.AWEB_SERVER_ADDR, 'tree', this.cur_treeId, 'node', this.selectedNodeId, 'material', this.selectedFile], '/')
        if (this.selectedFile.search(/.+\.(ppt|pptx|doc|docx|xls|xlsx)/g) !== -1) {
          return 'https://view.officeapps.live.com/op/view.aspx?src=' + serverUrl
        } else {
          return serverUrl
        }
      }
    },
    methods: {
      afterSuccessing (response, file, fileList) {
        this.$store.commit('PUT_FILE', {nodeId: this.selectedNodeId, file: this.cur_treeId + '_' + this.selectedNodeId + '_' + file.name.replace(/\s+/g, '_').toLowerCase()})
      },
      deleteFile (index, event) {
        if (event.stopPropagation) {
          event.stopPropagation()
        } else {
          event.cancelBubble = true
        }
        this.$store.dispatch('delete_file', {nodeId: this.selectedNodeId, index: index})
      },
      openFrame (file) {
        this.dialogVisible = true
        this.selectedFile = file
      }
    }
  }
</script>
<style scoped>
  .frame {
    width: 800px;
    height: 600px;
  }
</style>
