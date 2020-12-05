import {evalInTab} from 'puppet-strings'

export default function(tab) {
  return evalInTab(
    tab,
    [],
    `return performance.getEntriesByName('first-contentful-paint')[0].startTime`
  )
}
