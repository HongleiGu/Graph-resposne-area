import {
  BaseResponseAreaProps,
  BaseResponseAreaWizardProps,
} from '../base-props.type'
import { ResponseAreaTub } from '../response-area-tub'

import { GraphEditor } from './Graph.component'
import { Graph, CompressedGraph, CompressedGraphSchema } from './type'
import { Edge, Node } from './type'

export class GraphResponseAreaTub extends ResponseAreaTub {
  public readonly responseType = 'HANDDRAWNGRAPH'
  public readonly displayWideInput = true

  protected answerSchema = CompressedGraphSchema

  protected answer: CompressedGraph = {
    nodes: [],
    edges: [],
    directed: false,
    weighted: false,
    multigraph: false,
    name:'',
    metadata: {},
  }

  private previewFeedback: any = null

  public readonly delegateFeedback = false
  public readonly delegateLivePreview = true

  initWithConfig = () => {}

  /* -------------------- Custom Check -------------------- */
  customCheck(): void {
    if (this.previewFeedback) {
      throw new Error('preview failed')
    }
    this.previewFeedback = null
  }

  /* -------------------- Input -------------------- */
  InputComponent = (props: BaseResponseAreaProps) => {
    const parsed = this.answerSchema.safeParse(props.answer)
    const compressedAnswer = parsed.success ? parsed.data : this.answer

    const graph: Graph = {
      nodes: compressedAnswer.nodes.map((e) => JSON.parse(e)),
      edges: compressedAnswer.edges.map((e) => JSON.parse(e)),
      directed: compressedAnswer.directed,
      weighted: compressedAnswer.weighted,
      multigraph: compressedAnswer.multigraph,
      name: compressedAnswer.name,
      metadata: compressedAnswer.metadata,
    }

    return (
      <GraphEditor
        graph={graph}
        onChange={(val: Graph) => {
          const compressed: CompressedGraph = {
            ...compressedAnswer,
            nodes: val.nodes.map((n) => JSON.stringify(n)),
            edges: val.edges.map((e) => JSON.stringify(e)),
            directed: val.directed,
            weighted: val.weighted,
            multigraph: val.multigraph,
            name: val.name,
            metadata: val.metadata,
          }

          // 🔑 Keep instance state valid
          this.answer = compressed

          props.handleChange(compressed)
        }}
      />
    )
  }

  /* -------------------- Wizard -------------------- */
  WizardComponent = (props: BaseResponseAreaWizardProps) => {
    const graph: Graph = {
      nodes: this.answer.nodes.map((e) => JSON.parse(e)),
      edges: this.answer.edges.map((e) => JSON.parse(e)),
      directed: this.answer.directed,
      weighted: this.answer.weighted,
      multigraph: this.answer.multigraph,
      name: this.answer.name,
      metadata: this.answer.metadata,
    }

    return (
      <GraphEditor
        graph={graph}
        onChange={(val: Graph) => {
          const compressed: CompressedGraph = {
            ...this.answer,
            nodes: val.nodes.map((n: Node) => JSON.stringify(n)),
            edges: val.edges.map((e: Edge) => JSON.stringify(e)),
            directed: val.directed,
            weighted: val.weighted,
            multigraph: val.multigraph,
            name: val.name,
            metadata: val.metadata,
          }

          // 🔑 Wizard MUST update instance state first
          this.answer = compressed

          // 🔑 Wizard MUST emit full payload
          props.handleChange({
            responseType: this.responseType,
            answer: compressed,
          })
        }}
      />
    )
  }
}
