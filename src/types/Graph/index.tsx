import {
  BaseResponseAreaProps,
  BaseResponseAreaWizardProps,
} from '../base-props.type'
import { ResponseAreaTub } from '../response-area-tub'

import { GraphEditor } from './Graph.component'
import { Graph, CompressedGraph, CompressedGraphSchema, GraphFeedback, CheckPhase } from './type'
import { Edge, Node } from './type'
import { validateGraph } from './validateGraph'

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

  private previewFeedback: GraphFeedback | null = null
  private phase: CheckPhase = CheckPhase.Idle

  public readonly delegateFeedback = false
  public readonly delegateLivePreview = true

  initWithConfig = () => {}

  /* -------------------- Custom Check -------------------- */
  customCheck(): void {
    // Block submission if preview validation fails
    if (this.previewFeedback) {
      throw new Error('preview failed')
    }

    // Preview passed — ensure it's cleared
    this.previewFeedback = null
  }

  /* -------------------- Input -------------------- */
  InputComponent = (props: BaseResponseAreaProps) => {
    // Ensure a valid compressed graph answer
    const parsed = this.answerSchema.safeParse(props.answer)
    const compressedAnswer = parsed.success ? parsed.data : this.answer

    /* ---------- Extract submitted feedback ---------- */
    const submittedFeedback: GraphFeedback | null = (() => {
      const raw = props.feedback?.feedback
      if (!raw) return null

      try {
        const jsonPart = raw.split('<br>')[1]?.trim()
        if (!jsonPart) return null
        return JSON.parse(jsonPart)
      } catch {
        return null
      }
    })()

    /* ---------- Effective feedback ---------- */
    const effectiveFeedback = this.previewFeedback ?? submittedFeedback

    // Decompress to Graph format for editor
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
        feedback={effectiveFeedback}
        phase={this.phase}
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

          // Keep instance state valid
          this.answer = compressed

          // Validate the graph
          const preview = validateGraph(val)

          if (preview.errors.filter((e) => e.type === 'error').length > 0) {
            this.previewFeedback = preview
            this.phase = CheckPhase.PreviewError
          } else {
            this.previewFeedback = null
            this.phase = CheckPhase.Idle
          }

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
        feedback={null}
        phase={CheckPhase.Evaluated}
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

          // Wizard must update instance state first
          this.answer = compressed

          // Wizard must emit full payload
          props.handleChange({
            responseType: this.responseType,
            answer: compressed,
          })
        }}
      />
    )
  }
}
