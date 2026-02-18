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
  protected configSchema = CompressedGraphSchema

  // Correct answer for grading (teacher sets in "answer" panel)
  protected answer: CompressedGraph = {
    nodes: [],
    edges: [],
    directed: false,
    weighted: false,
    multigraph: false,
    name:'',
    metadata: {},
  }

  // Initial state shown to students (teacher sets in "preview" panel)
  protected config: CompressedGraph = {
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

  initWithDefault = () => {
    this.config = {
      nodes: [],
      edges: [],
      directed: false,
      weighted: false,
      multigraph: false,
      name:'',
      metadata: {},
    }
    this.answer = {
      nodes: [],
      edges: [],
      directed: false,
      weighted: false,
      multigraph: false,
      name:'',
      metadata: {},
    }
  }

  // Override extractConfig to handle missing/invalid config gracefully
  protected extractConfig = (provided: any): void => {
    if (!provided || typeof provided !== 'object') {
      // No config provided - use empty graph as default
      this.config = {
        nodes: [],
        edges: [],
        directed: false,
        weighted: false,
        multigraph: false,
        name:'',
        metadata: {},
      }
      return
    }

    const parsedConfig = this.configSchema?.safeParse(provided)
    if (!parsedConfig || !parsedConfig.success) {
      // Invalid config - use empty graph as default
      this.config = {
        nodes: [],
        edges: [],
        directed: false,
        weighted: false,
        multigraph: false,
        name:'',
        metadata: {},
      }
      return
    }

    this.config = parsedConfig.data
  }

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
    // In teacher preview mode, edit the initial config
    // In student mode, start with config and save to props.answer
    const isTeacherPreview = props.isTeacherMode && props.hasPreview
    
    // Determine the source of truth for the graph data
    const initialGraph: CompressedGraph = (() => {
      if (props.answer) {
        // If props.answer exists, use it (parent component's state)
        const parsed = this.answerSchema.safeParse(props.answer)
        if (parsed.success) {
          return parsed.data
        }
      }
      
      // Fallback to config (initial state) or answer (for teacher answer panel)
      return isTeacherPreview ? this.config : (this.config ?? this.answer)
    })()

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
      nodes: initialGraph.nodes.map((e) => JSON.parse(e)),
      edges: initialGraph.edges.map((e) => JSON.parse(e)),
      directed: initialGraph.directed,
      weighted: initialGraph.weighted,
      multigraph: initialGraph.multigraph,
      name: initialGraph.name,
      metadata: initialGraph.metadata,
    }

    return (
      <GraphEditor
        key={isTeacherPreview ? "teacher-preview-editor" : "student-input-editor"}
        graph={graph}
        feedback={effectiveFeedback}
        phase={this.phase}
        onChange={(val: Graph) => {
          const compressed: CompressedGraph = {
            nodes: val.nodes.map((n) => JSON.stringify(n)),
            edges: val.edges.map((e) => JSON.stringify(e)),
            directed: val.directed,
            weighted: val.weighted,
            multigraph: val.multigraph,
            name: val.name,
            metadata: val.metadata,
          }

          if (isTeacherPreview) {
            // Teacher is editing the initial config in preview section
            this.config = compressed
          }

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
    // Wizard shows correct answer for grading
    // The separate "Response Area Preview" section handles the initial state (config)
    const answerGraph: Graph = {
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
        key="wizard-answer-editor"
        graph={answerGraph}
        feedback={null}
        phase={CheckPhase.Evaluated}
        onChange={(val: Graph) => {
          const compressed: CompressedGraph = {
            nodes: val.nodes.map((n: Node) => JSON.stringify(n)),
            edges: val.edges.map((e: Edge) => JSON.stringify(e)),
            directed: val.directed,
            weighted: val.weighted,
            multigraph: val.multigraph,
            name: val.name,
            metadata: val.metadata,
          }

          this.answer = compressed

          props.handleChange({
            responseType: this.responseType,
            config: this.config,
            answer: compressed,
          })
        }}
      />
    )
  }
}
