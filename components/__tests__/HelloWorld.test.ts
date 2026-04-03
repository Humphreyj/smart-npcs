import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HelloWorld from '../HelloWorld.vue'

describe('HelloWorld', () => {
  it('renders the msg prop', async () => {
    const wrapper = await mountSuspended(HelloWorld, {
      props: { msg: 'Smart NPCs' },
    })
    expect(wrapper.find('h1').text()).toBe('Smart NPCs')
  })
})
