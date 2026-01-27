import { z } from 'zod'

import {
  BaseResponseAreaProps,
  BaseResponseAreaWizardProps,
} from '../base-props.type'
import { ResponseAreaTub } from '../response-area-tub'

import { FSAInput } from './FSA.component'
import { fsaAnswerSchema, FSA, defaultFSA, DEFAULT_FSA_CONFIG, FSAConfig } from './type'

export class FSAResponseAreaTub extends ResponseAreaTub {
  public readonly responseType = 'FSA'
  public readonly displayWideInput: boolean = true

  protected answerSchema = fsaAnswerSchema
  protected answer: FSA = defaultFSA // Never undefined now
  protected config: FSAConfig = DEFAULT_FSA_CONFIG
  private debug = ''

  initWithConfig = (config: any) => { 
      this.config = {
        ...DEFAULT_FSA_CONFIG,
        ...config, // not too sure about this, maybe the opposite so the default config is overwritten?
      }
    } 
    
  customCheck = () => {} // will set this up later

  /* -------------------- Input -------------------- */
  public InputComponent = (props: BaseResponseAreaProps): JSX.Element => {
    // Always ensure a valid FSA is passed
    const parsedAnswer = this.answerSchema.safeParse(props.answer)
    const validAnswer: FSA = parsedAnswer.success ? parsedAnswer.data : defaultFSA

    return (
      <>
      <p>{this.debug}</p>
      <FSAInput
        {...props}
        answer={validAnswer}
        handleChange={(val: FSA): void => {
          this.debug=JSON.stringify(val)
          props.handleChange(val)
        }}
      />
      </>
    )
  }

  /* -------------------- Wizard -------------------- */
  public WizardComponent = (
    props: BaseResponseAreaWizardProps,
  ): JSX.Element => {
    return (
      <>
        <p>answer: {JSON.stringify(this.answer)}    config: {JSON.stringify(this.config)}</p>
        <FSAInput
          {...props}
          answer={this.answer} // Guaranteed defined
          handleChange={(val: FSA): void => {
            this.answer = val
            console.log('Wizard val:', val)
            props.handleChange({
              responseType: this.responseType,
              answer: val,
              config: this.config as unknown as Record<string, string | number | boolean | null>
            })
          }}
        />
      </>
    )
  }
}
