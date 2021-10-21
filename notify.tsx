import type {
    OptionsObject,
    ProviderContext,
    SnackbarMessage,
    SnackbarProviderProps
  } from "notistack"
  
  type NoticeOptions = OptionsObject & {
    providerOptions?: Omit<SnackbarProviderProps, "children">
  }
  
  import type { Theme } from "@mui/material"
  import type { PropsWithChildren } from "react"
  
  import React, { Component, createContext, useState } from "react"
  import ReactDOM from "react-dom"
  import { ThemeProvider } from "@mui/material"
  import { SnackbarProvider, withSnackbar } from "notistack"
  
  import { mergeConfigs } from "/@/provider/ThemeProvider"
  import { promiseThemeConfig } from "/@/utils/userExperience"
  
  type MsgApiKey = "info" | "error" | "success" | "warning"
  
  type MsgFn = (
    msg: SnackbarMessage,
    options?: NoticeOptions
  ) => {
    closeSnackbar: ProviderContext["closeSnackbar"]
  }
  
  type AnchorOrigin = {
    vertical: "top" | "bottom"
    horizontal: "left" | "right" | "center"
  }
  
  interface MsgApi extends Record<MsgApiKey, MsgFn> {
    open: MsgFn
  }
  
  interface MsgProps extends ProviderContext {
    defaults?: NoticeOptions
    msgRef: (ins: Msg) => void
  }
  
  type ThemeSyncContext = {
    setTheme: (theme: Theme) => void
  }
  const ThemeSyncContext = createContext<ThemeSyncContext>({} as any)
  
  function ThemeSyncProvider(props: PropsWithChildren<unknown>) {
    const { savedTheme, mode } = promiseThemeConfig()
    const [config, setConfig] = useState<Theme>(mergeConfigs(savedTheme, mode))
  
    console.log("config ==== >", config)
    return (
      <ThemeSyncContext.Provider
        value={{
          setTheme: (config: Theme) => setConfig(config)
        }}
      >
        <ThemeProvider theme={config}>{props.children}</ThemeProvider>
      </ThemeSyncContext.Provider>
    )
  }
  
  class Msg extends Component<MsgProps, unknown> {
    static defineMsg: (defaults: NoticeOptions, cb?: (ins: Msg) => void) => void
    static contextType = ThemeSyncContext
    private readonly defaults: NoticeOptions
  
    constructor(props: MsgProps) {
      super(props)
      this.props.msgRef(this)
      this.defaults = this.props.defaults || {}
    }
  
    open(msg: SnackbarMessage, options: OptionsObject) {
      const snackKey = this.props.enqueueSnackbar(msg, options)
      return {
        closeSnackbar: () => {
          this.props.closeSnackbar(snackKey)
        }
      }
    }
  
    setTheme(theme: Theme) {
      this.context.setTheme(theme)
    }
  
    render() {
      return <></>
    }
  }
  
  // each anchor has an instance
  const apiIns: Record<string, Msg> = {}
  export const syncMsgTheme = (theme: Theme) => {
    Object.keys(apiIns).forEach((key) => {
      apiIns[key].setTheme(theme)
    })
  }
  
  const getApiInsKey = (anchor: AnchorOrigin) => {
    const { vertical, horizontal } = anchor
    return `${horizontal}-${vertical}`
  }
  
  const promiseAnchorOrigin = (defaults: NoticeOptions) => {
    defaults.anchorOrigin = Object.assign<unknown, AnchorOrigin, any>(
      {},
      {
        vertical: "top",
        horizontal: "center"
      },
      defaults.anchorOrigin
    )
  }
  
  const keepExtraOut = (defaults: NoticeOptions) => {
    const providerOptions: NoticeOptions["providerOptions"] = {
      ...defaults.providerOptions
    }
    // 如果不删除，会把这个属性当成props传递进去，会意外给native dom新增attrs，导致React警告
    delete defaults.providerOptions
  
    return {
      providerOptions
    }
  }
  
  const InjectedMsg = withSnackbar(Msg)
  Msg.defineMsg = function (defaults = {}, cb) {
    const key = getApiInsKey(defaults.anchorOrigin as AnchorOrigin)
  
    if (apiIns[key]) return
  
    const div = document.createElement("div")
    div.id = key
    document.body.appendChild(div)
  
    const { providerOptions } = keepExtraOut(defaults)
  
    const attrs = {
      maxSnack: providerOptions.maxSnack || 4,
      hideIconVariant: providerOptions.hideIconVariant ?? false
    }
    ReactDOM.render(
      <ThemeSyncProvider>
        <SnackbarProvider {...attrs}>
          <InjectedMsg
            defaults={{}}
            msgRef={(ins) => {
              if (!ins) return
  
              apiIns[key] = ins
              cb?.(ins)
            }}
          />
        </SnackbarProvider>
      </ThemeSyncProvider>,
      div
    )
  }
  
  // open 是唯一入口
  export const msg = {
    open: (msg, options = {}) => {
      promiseAnchorOrigin(options)
      const key = getApiInsKey(options.anchorOrigin as AnchorOrigin)
  
      if (apiIns[key]) {
        keepExtraOut(options)
        apiIns[key].open(msg, options)
      } else {
        Msg.defineMsg(options, (ins) => {
          ins.open(msg, options)
        })
      }
    }
  } as MsgApi
  
  //注入其它api
  ;(["info", "success", "error", "warning"] as const).forEach((type) => {
    msg[type] = (message, options) => {
      return msg.open(message, {
        ...options,
        variant: type
      })
    }
  })
  
  export const notify = {} as MsgApi
  ;(["info", "success", "error", "warning"] as const).forEach((type) => {
    notify[type] = (message, options = {}) => {
      return msg[type](
        message,
        Object.assign<NoticeOptions, NoticeOptions>(options, {
          providerOptions: {
            maxSnack: 5,
            hideIconVariant: false
          },
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right"
          }
        })
      )
    }
  })
  