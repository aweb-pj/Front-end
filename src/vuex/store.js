/* eslint-disable camelcase */
import Vue from 'vue'
import Vuex from 'vuex'
// import moment from 'moment'
import _ from 'lodash'

import io from 'socket.io-client'

Vue.use(Vuex)

const LOGIN = 'LOGIN'
const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
const LOGOUT = 'LOGOUT'

let BARRAGE_SERVER_ADDR = 'https://barrage.jtwang.me'
let AWEB_SERVER_ADDR = 'https://aweb.jtwang.me'

let socket = null

const state = {
  username: 'test_username', // TODO: should use real login function to replace with it
  connection_status: false,
  login_toggle: false,
  is_logged_in: false,
  login_pending: false,
  token: '',
  account: '',
  message_history: [],
  homework: {},
  menu_index: '0',
  delete_node_id: -1,
  material: {},
  isTeacher: false,
  displayBarrage: false,
  reports: [],
  treeIds: [],
  cur_treeId: '',
  resourceFile: {},
  resourceLink: {}
}

const mutations = {
  INTERVAL (state) {
    let mh = state.message_history
    let now = Date.parse(new Date())
    for (let i = 0; i < mh.length; i++) {
      let diff = (now - mh[i].border_color.time) / 1000
      if (diff > 5) {
        mh[i].border_color.color = 'rgb(255,255,255)'
      } else {
        let val = 51 * diff
        mh[i].border_color.color = 'rgb(' + val + ',' + val + ',255)'
      }
    }
  },

  TOGGLE_LOGIN_BOX (state, status) {
    state.login_toggle = status
  },

  CHANGE_CONNECTION_STATUS (state, status) {
    state.connection_status = status
  },

  [LOGIN] (state) {
    state.login_pending = true
  },

  [LOGIN_SUCCESS] (state, {username, isTeacher}) {
    state.is_logged_in = true
    state.login_pending = false
    state.username = username
    state.isTeacher = isTeacher
  },

  [LOGOUT] (state) {
    state.is_logged_in = false
  },

  PUT_MESSAGE (state, message) {
    state.message_history.unshift(message)
  },

  CLICK_PLUS_ONE (state, id) {
    let index = _.findIndex(state.message_history, function (message) { return message.id === id })
    let bgColor = state.message_history[index].bg_color
    let tmp = bgColor.substring(4, bgColor.length - 1).split(',')
    let r = parseInt(tmp[0])
    let g = parseInt(tmp[1])
    let b = parseInt(tmp[2])
    ++state.message_history[index].clicks
    state.message_history[index].bg_color = 'rgb(' + (r - 2) + ',' + (g - 2) + ',' + (b - 2) + ')'
  },

  CLICK_MINUS_ONE (state, id) {
    let index = _.findIndex(state.message_history, function (message) { return message.id === id })
    let bgColor = state.message_history[index].bg_color
    let tmp = bgColor.substring(4, bgColor.length - 1).split(',')
    let r = parseInt(tmp[0])
    let g = parseInt(tmp[1])
    let b = parseInt(tmp[2])
    --state.message_history[index].clicks
    state.message_history[index].bg_color = 'rgb(' + (r + 2) + ',' + (g + 2) + ',' + (b + 2) + ')'
  },

  PUT_QUESTION (state, {nodeId, question}) {
    if (nodeId !== null) {
      if (_.has(state.homework, nodeId) === false) {
        Vue.set(state.homework, nodeId, {publish: false, questions: []})
      }
      state.homework[nodeId].questions.push(question)
    }
  },

  CLEAN_QUESTIONS (state, nodeId) {
    if (nodeId !== null) {
      if (_.has(state.homework, nodeId) === false) {
        Vue.set(state.homework, nodeId, {publish: false, questions: []})
      } else {
        while (state.homework[nodeId].questions.length !== 0) {
          state.homework[nodeId].questions.pop()
        }
      }
    }
  },

  SET_HOMEWORK_PUBLISH (state, {nodeId, publish}) {
    state.homework[nodeId].publish = publish
  },

  CHANGE_MENU_INDEX (state, index) {
    state.menu_index = index
  },
  DELETE_QUESTION (state, {nodeId, index}) {
    state.homework[nodeId].questions.splice(index, 1)
  },

  DELETE_NODE (state, id) {
    state.delete_node_id = id
  },

  PUT_FILE (state, {nodeId, file}) {
    if (nodeId !== null) {
      if (_.has(state.material, nodeId) === false) {
        Vue.set(state.material, nodeId, [])
      }
      state.material[nodeId].push(file)
    }
  },
  PUT_RESOURCE_FILE (state, {nodeId, file}) {
    if (nodeId !== null) {
      if (_.has(state.resourceFile, nodeId) === false) {
        Vue.set(state.resourceFile, nodeId, [])
      }
      state.resourceFile[nodeId].push(file)
    }
  },
  PUT_RESOURCE_LINK (state, {nodeId, file}) {
    if (nodeId !== null) {
      if (_.has(state.resourceLink, nodeId) === false) {
        Vue.set(state.resourceLink, nodeId, [])
      }
      state.resourceLink[nodeId].push(file)
    }
  },

  CLEAN_FILES (state, nodeId) {
    if (nodeId !== null) {
      if (_.has(state.material, nodeId) === false) {
        Vue.set(state.material, nodeId, [])
      } else {
        while (state.material[nodeId].length !== 0) {
          state.material[nodeId].pop()
        }
      }
    }
  },
  CLEAN_RESOURCE_FILES (state, nodeId) {
    if (nodeId !== null) {
      if (_.has(state.resourceFile, nodeId) === false) {
        Vue.set(state.resourceFile, nodeId, [])
      } else {
        while (state.resourceFile[nodeId].length !== 0) {
          state.resourceFile[nodeId].pop()
        }
      }
    }
  },
  CLEAN_RESOURCE_LINKS (state, nodeId) {
    if (nodeId !== null) {
      if (_.has(state.resourceLink, nodeId) === false) {
        Vue.set(state.resourceLink, nodeId, [])
      } else {
        while (state.resourceLink[nodeId].length !== 0) {
          state.resourceLink[nodeId].pop()
        }
      }
    }
  },
  DELETE_FILE (state, {nodeId, index}) {
    state.material[nodeId].splice(index, 1)
  },
  DELETE_RESOURCE_FILE (state, {nodeId, index}) {
    state.resourceFile[nodeId].splice(index, 1)
  },
  DELETE_RESOURCE_LINK (state, {nodeId, index}) {
    state.resourceLink[nodeId].splice(index, 1)
  },
  DISPLAY_BARRAGE (state, newState) {
    state.displayBarrage = newState
  },
  SAVE_REPORTS (state, {nodeId, val}) {
    // for (let i = 0; i < val.length; i++) {
    //   val[i].rate = Math.floor(val[i].correct / val[i].total * 100) / 100
    // }
    state.reports[nodeId] = val
  },
  SET_TREEIDS (state, treeIds) {
    state.treeIds = treeIds
  },
  ADD_TREEID (state, id) {
    state.treeIds.push(id)
  },
  SET_CURTREEID (state, id) {
    state.cur_treeId = id
  }
}

const actions = {
  connect ({commit, state}) {
    if (state.connection_status === false) {
      socket = io(BARRAGE_SERVER_ADDR)
      socket.on('connect', () => {
        commit('CHANGE_CONNECTION_STATUS', true)
      })
    }

    if (state.username === '') {
      if (localStorage.getItem('token') !== null && localStorage.getItem('username') !== null) {
        commit(LOGIN_SUCCESS, localStorage.getItem('username'))
      }
    }

    socket.on('disconnect', () => {
      commit('CHANGE_CONNECTION_STATUS', false)
    })
    socket.on('server_message', (message) => {
      message.border_color = {color: 'rgb(0,0,255)', time: Date.parse(new Date())}
      message.liked = false
      message.disliked = false
      commit('PUT_MESSAGE', message)
    })
    socket.on('server_click', (id) => {
      commit('CLICK_PLUS_ONE', id)
    })
    socket.on('server_dislike', (id) => {
      commit('CLICK_MINUS_ONE', id)
    })
  },

  login ({commit}, {username, password, isTeacher}) {
    // commit(LOGIN)
    commit(LOGIN_SUCCESS, {username, isTeacher})
  },

  logout ({commit}) {
    localStorage.removeItem('token')
    commit(LOGOUT)
  },

  time_watcher ({commit}) {
    setInterval(function () {
      commit('INTERVAL')
    }, 10)
  },

  send_message ({commit}, content) {
    // let time = moment().calendar()
    socket.emit('client_message', content)
  },

  click_plus ({commit}, id) {
    socket.emit('client_click', id)
    commit('CLICK_PLUS_ONE', id)
  },

  click_minus ({commit}, id) {
    socket.emit('client_dislike', id)
    commit('CLICK_MINUS_ONE', id)
  },

  change_menu ({commit}, index) {
    commit('CHANGE_MENU_INDEX', index)
  },

  async get_homework ({commit, state}, nodeId) {
    try {
      let response = await Vue.http.get(AWEB_SERVER_ADDR + '/node/' + nodeId + '/homework')
      let homework = response.data
      commit('CLEAN_QUESTIONS', nodeId)
      commit('SET_HOMEWORK_PUBLISH', {nodeId: nodeId, publish: homework.publish})
      _.forEach(homework.questions, function (question) {
        if (!state.isTeacher) {
          question.solution = {A: false, B: false, C: false, D: false}
        }
        commit('PUT_QUESTION', {nodeId, question})
      })
    } catch (error) {
      commit('CLEAN_QUESTIONS', nodeId)
    }
  },
  async save_homework ({state}, nodeId) {
    try {
      await this.$http.post(state.AWEB_SERVER_ADDR + '/node/' + nodeId + '/homework', state.homework[nodeId])
    } catch (e) {
    }
  },

  put_question ({commit, state}, question) {
    if (!state.isTeacher) {
      question.solution = {A: false, B: false, C: false, D: false}
    }
    commit('PUT_QUESTION', question)
  },
  delete_question ({commit}, {nodeId, index}) {
    commit('DELETE_QUESTION', {nodeId, index})
  },
  update_questions ({commit, state}, {nodeId, questions}) {
    try {
      commit('CLEAN_QUESTIONS', nodeId)
      _.forEach(questions, function (question) {
        if (!state.isTeacher) {
          question.solution = {A: false, B: false, C: false, D: false}
        }
        commit('PUT_QUESTION', {nodeId, question})
      })
    } catch (error) {
      console.log(error)
    }
  },
  delete_node ({commit}, id) {
    commit('DELETE_NODE', id)
  },

  async get_material ({commit, state}, nodeId) {
    try {
      let response = await Vue.http.get(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/material')
      let material = response.data
      // let material = ['1.png', '2.txt']
      commit('CLEAN_FILES', nodeId)
      _.forEach(material, function (file) {
        commit('PUT_FILE', {nodeId, file})
      })
    } catch (error) {
      commit('CLEAN_FILES', nodeId)
    }
  },
  async get_resource_file ({commit, state}, nodeId) {
    try {
      let response = await Vue.http.get(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/resource/file')
      let resourceFiles = response.data
      commit('CLEAN_RESOURCE_FILES', nodeId)
      _.forEach(resourceFiles, function (file) {
        commit('PUT_RESOURCE_FILE', {nodeId, file})
      })
    } catch (error) {
      commit('CLEAN_RESOURCE_FILES', nodeId)
    }
  },
  async get_resource_link ({commit, state}, nodeId) {
    try {
      let response = await Vue.http.get(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/resource/link')
      let resourceLinks = response.data
      commit('CLEAN_RESOURCE_LINKS', nodeId)
      _.forEach(resourceLinks, function (file) {
        commit('PUT_RESOURCE_LINK', {nodeId, file})
      })
    } catch (error) {
      commit('CLEAN_RESOURCE_LINKS', nodeId)
    }
  },
  async update_files ({commit, state}, {nodeId, files}) {
    try {
      await Vue.http.put(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/material', {material: files})
      commit('CLEAN_FILES', nodeId)
      _.forEach(files, function (file) {
        commit('PUT_FILE', {nodeId, file})
      })
    } catch (error) {
      console.log(error)
    }
  },
  async update_resource_files ({commit, state}, {nodeId, files}) {
    try {
      await Vue.http.put(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/resource/file', {resource_file: files})
      commit('CLEAN_RESOURCE_FILES', nodeId)
      _.forEach(files, function (file) {
        commit('PUT_RESOURCE_FILE', {nodeId, file})
      })
    } catch (error) {
      console.log(error)
    }
  },
  async update_resource_links ({commit, state}, {nodeId, files}) {
    try {
      await Vue.http.put(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/resource/link', {resource_link: files})
      commit('CLEAN_RESOURCE_LINKS', nodeId)
      _.forEach(files, function (file) {
        commit('PUT_RESOURCE_LINK', {nodeId, file})
      })
    } catch (error) {
      console.log(error)
    }
  },
  async delete_file ({commit, state}, {nodeId, index}) {
    try {
      await Vue.http.delete(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/material/' + state.material[nodeId][index])
      commit('DELETE_FILE', {nodeId, index})
    } catch (error) {
      console.log(error)
    }
  },
  async delete_resource_file ({commit, state}, {nodeId, index}) {
    try {
      let url = state.resourceFile[nodeId][index].url
      let tmp = url.split('/')
      let filename = tmp[tmp.length - 1]
      await Vue.http.delete(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/resource/file/' + filename)
      commit('DELETE_RESOURCE_FILE', {nodeId, index})
    } catch (error) {
      console.log(error)
    }
  },
  async delete_resource_link ({commit, state}, {nodeId, index}) {
    try {
      let body = {resource_link: state.resourceLink[nodeId][index]}
      console.log(body)
      await Vue.http.post(AWEB_SERVER_ADDR + '/tree/' + state.cur_treeId + '/node/' + nodeId + '/resource/link/delete', body)
      commit('DELETE_RESOURCE_LINK', {nodeId, index})
    } catch (error) {
      console.log(error)
    }
  },

  display_barrage ({commit}, newState) {
    commit('DISPLAY_BARRAGE', newState)
  },

  save_reports ({commit}, {nodeId, val}) {
    commit('SAVE_REPORTS', {nodeId, val})
  },

  set_treeIds ({commit}, treeIds) {
    commit('SET_TREEIDS', treeIds)
  },

  add_treeId ({commit}, id) {
    commit('ADD_TREEID', id)
  },

  set_curTreeId ({commit}, id) {
    commit('SET_CURTREEID', id)
  }
}

export default new Vuex.Store({
  state: state,
  mutations: mutations,
  actions: actions,
  getters: {
    connection_status () {
      return state.connection_status
    },
    is_logged_in () {
      return state.is_logged_in
    },
    login_pending () {
      return state.login_pending
    },
    username () {
      return state.username
    },
    message_history () {
      return state.message_history
    },
    exercises () {
      return state.homework
    },
    menu_index () {
      return state.menu_index
    },
    isTeacher () {
      return state.isTeacher
    },
    display_barrage () {
      return state.displayBarrage
    },
    reports () {
      return state.reports
    },
    treeIds () {
      return state.treeIds
    },
    cur_treeId () {
      return state.cur_treeId
    }
  },

  strict: process.env.NODE_ENV !== 'production'
})
