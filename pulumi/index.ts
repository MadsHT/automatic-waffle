import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";

const appLabels = { app: "sec-demo", pass: "true" };
const deployment = new k8s.apps.v1.Deployment("demo-container", {
    spec: {
        selector: { matchLabels: appLabels },
        replicas: 1,
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [{
                    name: "sec-demo",
                    image: "surftown1/website:no-pass",
                    env: [{
                        name: 'HTPASSWD',
                        valueFrom: {
                            secretKeyRef: {
                                name: "demo-sealed-secret",
                                key: "HTPASSWD",
                                optional: false
                            }
                        }
                    }]
                }]
            }
        }
    }
});

const appLabelsNoPass = { app: "sec-demo", pass: "false" };
const deploymentNoPass = new k8s.apps.v1.Deployment("demo-container-no-pass", {
    spec: {
        selector: { matchLabels: appLabelsNoPass },
        replicas: 1,
        template: {
            metadata: { labels: appLabelsNoPass },
            spec: {
                containers: [{
                    name: "sec-demo",
                    image: "surftown1/website:no-pass",
                }]
            }
        }
    }
});


// Deploy the bitnami/wordpress chart.
const sealedSecrets = new k8s.helm.v3.Chart("sealed-secrets", {
    version: "2.2.x",
    chart: "sealed-secrets",
    namespace: "kube-system",
    fetchOpts: {
        repo: "https://bitnami-labs.github.io/sealed-secrets",
    },
    values: {
        fullnameOverride: "sealed-secrets-controller"
    },
});


const demoSecret = new k8s.apiextensions.CustomResource("demo-sec", {
    apiVersion: "bitnami.com/v1alpha1",
    kind: "SealedSecret",
    metadata: {
        name: "demo-sealed-secret",
        namespace: "default"
    },
    spec: {
        encryptedData: {
            HTPASSWD: 'AgDB/nVuB5sy/qg1irCSfYSKIAb9tc2tKuatbYuUopd51F1KZAcV7lJJSA7Vgtx7EBFOvwinALthDIvfULZml5RwfCmLGRLOnx7b/jh64Ppcd0BxnQu5Wa9SL/PPa4985j8CczAXCRe2xyjPZhTq+a0pVw8m6AWQLvm3dtMW31kiWQ92PXypj6EnGMkBv5xHHiZfc0K6fOkjbmKmX4CvWzmn1pX2N0MAKZVgLpMP0RCWFNTZ0xcw38aQyYPI6sxsxm746J90CB62Tgt+vdJi02K2jbIk7PE1ir+EoMk1ZFq93cn2gCyRzk3dKYlEWzdr3SRfqUUtV5Z2g1+yGM5NGs1lW/RVni/a7d3CjFyCbDRWNTONt+egDb2tRa9jngYhKC44mAV+iW++qAOqBWLxAh8k1e6h0lPGAddnEBKN6Um8qdkCJF13lW9Ry0oENqJ0dL/JLMswKl7JDNdg4+9lOaWdK8jR/59yM/p1wnoR1WDVhVQ6emDV78BSVyN8obHZ5RqTwkkqkaxw/qGHOrD6lpZ3sOB4I73BghEFCt5K/9nTJC1AH47SMjCH8J+6QlV1ydBKYcSD1k00Rz0yjWQz8sf5Z5enVe10WW/ZICl9Lj3IqDIEqULGC+8zQJP4ZdxVQZhQOpBiWad5f5U1vgzX7ww7VBNLuo5p0LnfblZp21EIVUcJWIm63dndssTKMiV03cYny6yymoZfNEHzJcsBP1Jw7QX9UR6YP4RNwp6nuYpF/JPtlVUXVzsUzQ=='
        },
        template: {
            metadata: {
                name: "demo-sealed-secret",
                namespace: "default"
            }
        }
    }
});

export const name = deployment.metadata.name;
