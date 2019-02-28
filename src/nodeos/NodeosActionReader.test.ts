import { NotInitializedError } from 'demux'
import request from 'request-promise-native'
import { nodeosRawBlock } from '../testHelpers/nodeosRawBlock'
import { NodeosActionReader } from './NodeosActionReader'

describe('NodeosActionReader', () => {
  let reader: NodeosActionReader

  const blockInfo = {
    last_irreversible_block_num: 10,
    head_block_num: 20,
  }

  beforeAll(() => {
    request.get = jest.fn(async () => blockInfo)
    request.post = jest.fn(async () => nodeosRawBlock)
  })

  beforeEach(() => {
    reader = new NodeosActionReader({
      nodeosEndpoint: '',
      startAtBlock: 10,
      onlyIrreversible: false
    })
  })

  it('returns head block number', async () => {
    const blockNum = await reader.getHeadBlockNumber()
    expect(blockNum).toBe(20)
  })

  it('returns last irreversible block number', async () => {
    const blockNum = await reader.getLastIrreversibleBlockNumber()
    expect(blockNum).toBe(10)
  })

  it('gets block with correct block number', async () => {
    const block = await reader.getBlock(20)
    expect(block.blockInfo.blockNumber).toEqual(20)
  })

  it('throws if not correctly initialized', async () => {
    request.get = jest.fn(async () => { throw new Error('404: This page does not exist') })
    reader.getLastIrreversibleBlockNumber = jest.fn(() => blockInfo)
    const result = reader.getNextBlock()
    expect(result).rejects.toThrow(NotInitializedError)
  })

  it('returns head block minus the number of required confirmations if configured', async () => {
    reader = new NodeosActionReader({
      nodeosEndpoint: '',
      startAtBlock: 1,
      onlyIrreversible: false,
      numberOfConfirmations: 2
    })
    request.get = jest.fn(async () => blockInfo)
    const blockNum = await reader.getHeadBlockNumber()
    expect(blockNum).toBe(18)
  })

  it('gets a block', async () => {
    const block = await reader.getBlock(20)
    expect(block).toEqual({
      actions: [
        {
          payload: {
            account: 'testing',
            actionIndex: 0,
            status: 'executed',
            cpu_usage_us: 778,
            net_usage_words: 14,
            expiration: '2018-06-16T06:31:33',
            authorization: [
              {
                actor: 'testing',
                permission: 'active',
              },
            ],
            data: {
              memo: 'EOS is awesome!',
            },
            name: 'action',
            transactionId: 'b890beb84a6d1d77755f2e0cdad48e2ffcfd06ff3481917b4875cc5f3a343533',
          },
          type: 'testing::action',
        },
        {
          payload: {
            account: 'testing',
            actionIndex: 1,
            status: 'executed',
            cpu_usage_us: 778,
            net_usage_words: 14,
            expiration: '2018-06-16T06:31:33',
            authorization: [
              {
                actor: 'testing',
                permission: 'active',
              },
            ],
            data: {
              memo: 'Go EOS!',
            },
            name: 'action2',
            transactionId: 'b890beb84a6d1d77755f2e0cdad48e2ffcfd06ff3481917b4875cc5f3a343533',
          },
          type: 'testing::action2',
        },
      ],
      blockInfo: {
        blockHash: '000f4241873a9aef0daefd47d8821495b6f61c4d1c73544419eb0ddc22a9e906',
        blockNumber: 20,
        previousBlockHash: '000f42401b5636c3c1d88f31fe0e503654091fb822b0ffe21c7d35837fc9f3d8',
        timestamp: new Date('2018-06-16T05:59:49.500'),
      },
    })
  })
})
