'use strict'
const { primitives } = require('@jscad/modeling')
const main = () => primitives.sphere({ radius: 10, segments: 32 })
module.exports = { main }
