export function loginemail(env, urlparams, otp, email, from) {
  if (!urlparams || !email || !from || !otp) throw new Error("insufficient args");
  const emailAsURIComponent = encodeURIComponent(email);
  const half1 = email.substr(0, email.indexOf("@") + 1).replace("@", " [at] ");
  const half2 = email.substr(email.indexOf("@") + 1, email.length).replaceAll(".", " [dot] ");
  const greet = half1+half2
  const landingurl = env.LANDING;
  const lweurl = env.LWE_PATH;
  const nameplate = env.NAMEPLATE;
  const tagline = env.TAGLINE;
  const loginpage = env.LOGINPAGE;
  // min is at least 1m (but not accounted for here)
  const valid = env.MAGICLINK_VALIDITY_MINS;
  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  <html dir="ltr"
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width"/>
  
          <title> </title>
  
          <style type="text/css">
            .rdns-email,td{font-family:BlinkMacSystemFont, Segoe UI,Roboto,Ubuntu,Droid Sans,Helvetica Neue, sans-serif;}
            .rdns-email{text-align:left;line-height:1.5;max-width:600px;padding-top:32px; padding-left:64px;padding-right:64px}
            @media only screen and (max-device-width:480px) {.rdns-email{padding-top:0;padding-left:16px;padding-right:16px}}
            .rdns-email-button-hover{transition:background 140ms ease-in}
            .rdns-email-button-hover:hover{background:rgba(58,56,52,.08)}
  
            #__bodyTable__ {
              margin: 0;
              padding: 0;
              width: 100% !important;
            }
          </style>
  
          <!--[if gte mso 9]>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          <![endif]-->
      </head>
      <body bgcolor="#FFFFFF" width="100%"
          style="-webkit-font-smoothing: antialiased; width:100% !important; background:#FFFFFF;-webkit-text-size-adjust:none;
              margin:0; padding:0; min-width:100%; direction: ltr;">
          <table bgcolor="#FFFEFE" id="__bodyTable__" width="100%" style="-webkit-font-smoothing: antialiased;
              width:100% !important; background:#FEFEFE;-webkit-text-size-adjust:none; margin:0; padding:0; min-width:100%">
              <tr>
                  <td align="center">
                  <span style="display: none !important; color: #FFFFFF; margin:0; padding:0; font-size:1px; line-height:1px;"> </span>
                  <div class="rdns-email">
                      <h1 style="color:#333;font-size:20px">
                          Login
                      </h1>
                      <p style="color:inherit;">For ${greet},</p>
                      <a href="${lweurl}?${urlparams}">
                        Click here to login with magic link
                      </a>
                      <p style="color:inherit;">Or enter this magic code:</p>
                      <p style="margin:20px 0; font-size:1.2rem;">
                        <span style="display:inline-block; padding:16px 16px;border:1px solid #EEEEEE;background-color:#F4F4F8;border-radius:10px;margin:24px 0;" class="rdns-email-button-hover">
                          ${otp}
                        </span>
                      </p>
                      <div style="color:#666;margin-top:12px">If you did not try to login, you can safely ignore this email.</div>
                      <div style="color:#AAAAAA;margin-top:12px"> 
                          Magic codes expire in ${valid} minutes. <a style="color:inherit" href="${loginpage}?m=ml&e=${emailAsURIComponent}">Click here to generate a new one</a>.
                          <div style="margin-top:12px">
                              Requested by ${from}.
                          </div>
                      </div>
                      <div style="font-size:12px;margin-top:32px;margin-bottom:42px;color:#888">
                          <div>
                              <a href="${landingurl}" style="color:inherit">${nameplate}</a>
                              <br/>${tagline}
                          </div>
                      </div>
                  </div>
                  </td>
              </tr>
         </table>
      </body>
  </html>
  `
}