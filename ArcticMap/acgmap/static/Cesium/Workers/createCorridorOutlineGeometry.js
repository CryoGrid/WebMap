define(["./GeometryOffsetAttribute-821af768","./arrayRemoveDuplicates-80a91d16","./Transforms-f15de320","./Matrix2-c6c16658","./RuntimeError-5b082e8f","./ComponentDatatype-3d0a0aac","./PolylineVolumeGeometryLibrary-87e70ef0","./CorridorGeometryLibrary-230b9c04","./when-4bbc8319","./GeometryAttribute-8350368e","./GeometryAttributes-7827a6c2","./IndexDatatype-ddbc25a7","./PolygonPipeline-ff4d4077","./combine-e9466e32","./WebGLConstants-508b9636","./EllipsoidTangentPlane-41514392","./AxisAlignedBoundingBox-a572809f","./IntersectionTests-a4e54d9a","./Plane-26e67b94","./PolylinePipeline-013902ec","./EllipsoidGeodesic-2e7ba57d","./EllipsoidRhumbLine-c6741351"],(function(e,t,i,r,o,n,s,a,l,d,u,p,f,c,h,y,g,b,m,A,_,E){"use strict";const C=new r.Cartesian3,G=new r.Cartesian3,T=new r.Cartesian3;function P(e,t){const i=[],o=e.positions,f=e.corners,c=e.endPositions,h=new u.GeometryAttributes;let y,g,b,m=0,A=0,_=0;for(g=0;g<o.length;g+=2)b=o[g].length-3,m+=b,_+=b/3*4,A+=o[g+1].length-3;for(m+=3,A+=3,g=0;g<f.length;g++){y=f[g];const e=f[g].leftPositions;l.defined(e)?(b=e.length,m+=b,_+=b/3*2):(b=f[g].rightPositions.length,A+=b,_+=b/3*2)}const E=l.defined(c);let P;E&&(P=c[0].length-3,m+=P,A+=P,P/=3,_+=4*P);const v=m+A,w=new Float64Array(v);let L,D,x,k,N,O,V=0,H=v-1;const I=P/2,S=p.IndexDatatype.createTypedArray(v/3,_+4);let B=0;if(S[B++]=V/3,S[B++]=(H-2)/3,E){i.push(V/3),O=C,N=G;const e=c[0];for(g=0;g<I;g++)O=r.Cartesian3.fromArray(e,3*(I-1-g),O),N=r.Cartesian3.fromArray(e,3*(I+g),N),a.CorridorGeometryLibrary.addAttribute(w,N,V),a.CorridorGeometryLibrary.addAttribute(w,O,void 0,H),D=V/3,k=D+1,L=(H-2)/3,x=L-1,S[B++]=L,S[B++]=x,S[B++]=D,S[B++]=k,V+=3,H-=3}let M=0,R=o[M++],U=o[M++];for(w.set(R,V),w.set(U,H-U.length+1),b=U.length-3,i.push(V/3,(H-2)/3),g=0;g<b;g+=3)D=V/3,k=D+1,L=(H-2)/3,x=L-1,S[B++]=L,S[B++]=x,S[B++]=D,S[B++]=k,V+=3,H-=3;for(g=0;g<f.length;g++){let e;y=f[g];const n=y.leftPositions,d=y.rightPositions;let u,p=T;if(l.defined(n)){for(H-=3,u=x,i.push(k),e=0;e<n.length/3;e++)p=r.Cartesian3.fromArray(n,3*e,p),S[B++]=u-e-1,S[B++]=u-e,a.CorridorGeometryLibrary.addAttribute(w,p,void 0,H),H-=3;i.push(u-Math.floor(n.length/6)),t===s.CornerType.BEVELED&&i.push((H-2)/3+1),V+=3}else{for(V+=3,u=k,i.push(x),e=0;e<d.length/3;e++)p=r.Cartesian3.fromArray(d,3*e,p),S[B++]=u+e,S[B++]=u+e+1,a.CorridorGeometryLibrary.addAttribute(w,p,V),V+=3;i.push(u+Math.floor(d.length/6)),t===s.CornerType.BEVELED&&i.push(V/3-1),H-=3}for(R=o[M++],U=o[M++],R.splice(0,3),U.splice(U.length-3,3),w.set(R,V),w.set(U,H-U.length+1),b=U.length-3,e=0;e<U.length;e+=3)k=V/3,D=k-1,x=(H-2)/3,L=x+1,S[B++]=L,S[B++]=x,S[B++]=D,S[B++]=k,V+=3,H-=3;V-=3,H+=3,i.push(V/3,(H-2)/3)}if(E){V+=3,H-=3,O=C,N=G;const e=c[1];for(g=0;g<I;g++)O=r.Cartesian3.fromArray(e,3*(P-g-1),O),N=r.Cartesian3.fromArray(e,3*g,N),a.CorridorGeometryLibrary.addAttribute(w,O,void 0,H),a.CorridorGeometryLibrary.addAttribute(w,N,V),k=V/3,D=k-1,x=(H-2)/3,L=x+1,S[B++]=L,S[B++]=x,S[B++]=D,S[B++]=k,V+=3,H-=3;i.push(V/3)}else i.push(V/3,(H-2)/3);return S[B++]=V/3,S[B++]=(H-2)/3,h.position=new d.GeometryAttribute({componentDatatype:n.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:w}),{attributes:h,indices:S,wallIndices:i}}function v(e){const t=(e=l.defaultValue(e,l.defaultValue.EMPTY_OBJECT)).positions,i=e.width,o=l.defaultValue(e.height,0),a=l.defaultValue(e.extrudedHeight,o);this._positions=t,this._ellipsoid=r.Ellipsoid.clone(l.defaultValue(e.ellipsoid,r.Ellipsoid.WGS84)),this._width=i,this._height=Math.max(o,a),this._extrudedHeight=Math.min(o,a),this._cornerType=l.defaultValue(e.cornerType,s.CornerType.ROUNDED),this._granularity=l.defaultValue(e.granularity,n.CesiumMath.RADIANS_PER_DEGREE),this._offsetAttribute=e.offsetAttribute,this._workerName="createCorridorOutlineGeometry",this.packedLength=1+t.length*r.Cartesian3.packedLength+r.Ellipsoid.packedLength+6}v.pack=function(e,t,i){i=l.defaultValue(i,0);const o=e._positions,n=o.length;t[i++]=n;for(let e=0;e<n;++e,i+=r.Cartesian3.packedLength)r.Cartesian3.pack(o[e],t,i);return r.Ellipsoid.pack(e._ellipsoid,t,i),i+=r.Ellipsoid.packedLength,t[i++]=e._width,t[i++]=e._height,t[i++]=e._extrudedHeight,t[i++]=e._cornerType,t[i++]=e._granularity,t[i]=l.defaultValue(e._offsetAttribute,-1),t};const w=r.Ellipsoid.clone(r.Ellipsoid.UNIT_SPHERE),L={positions:void 0,ellipsoid:w,width:void 0,height:void 0,extrudedHeight:void 0,cornerType:void 0,granularity:void 0,offsetAttribute:void 0};return v.unpack=function(e,t,i){t=l.defaultValue(t,0);const o=e[t++],n=new Array(o);for(let i=0;i<o;++i,t+=r.Cartesian3.packedLength)n[i]=r.Cartesian3.unpack(e,t);const s=r.Ellipsoid.unpack(e,t,w);t+=r.Ellipsoid.packedLength;const a=e[t++],d=e[t++],u=e[t++],p=e[t++],f=e[t++],c=e[t];return l.defined(i)?(i._positions=n,i._ellipsoid=r.Ellipsoid.clone(s,i._ellipsoid),i._width=a,i._height=d,i._extrudedHeight=u,i._cornerType=p,i._granularity=f,i._offsetAttribute=-1===c?void 0:c,i):(L.positions=n,L.width=a,L.height=d,L.extrudedHeight=u,L.cornerType=p,L.granularity=f,L.offsetAttribute=-1===c?void 0:c,new v(L))},v.createGeometry=function(o){let s=o._positions;const u=o._width,c=o._ellipsoid;s=function(e,t){for(let i=0;i<e.length;i++)e[i]=t.scaleToGeodeticSurface(e[i],e[i]);return e}(s,c);const h=t.arrayRemoveDuplicates(s,r.Cartesian3.equalsEpsilon);if(h.length<2||u<=0)return;const y=o._height,g=o._extrudedHeight,b=!n.CesiumMath.equalsEpsilon(y,g,0,n.CesiumMath.EPSILON2),m={ellipsoid:c,positions:h,width:u,cornerType:o._cornerType,granularity:o._granularity,saveAttributes:!1};let A;if(b)m.height=y,m.extrudedHeight=g,m.offsetAttribute=o._offsetAttribute,A=function(t){const i=t.ellipsoid,r=P(a.CorridorGeometryLibrary.computePositions(t),t.cornerType),o=r.wallIndices,s=t.height,u=t.extrudedHeight,c=r.attributes,h=r.indices;let y=c.position.values,g=y.length,b=new Float64Array(g);b.set(y);const m=new Float64Array(2*g);if(y=f.PolygonPipeline.scaleToGeodeticHeight(y,s,i),b=f.PolygonPipeline.scaleToGeodeticHeight(b,u,i),m.set(y),m.set(b,g),c.position.values=m,g/=3,l.defined(t.offsetAttribute)){let i=new Uint8Array(2*g);if(t.offsetAttribute===e.GeometryOffsetAttribute.TOP)i=e.arrayFill(i,1,0,g);else{const r=t.offsetAttribute===e.GeometryOffsetAttribute.NONE?0:1;i=e.arrayFill(i,r)}c.applyOffset=new d.GeometryAttribute({componentDatatype:n.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:1,values:i})}let A;const _=h.length,E=p.IndexDatatype.createTypedArray(m.length/3,2*(_+o.length));E.set(h);let C,G,T=_;for(A=0;A<_;A+=2){const e=h[A],t=h[A+1];E[T++]=e+g,E[T++]=t+g}for(A=0;A<o.length;A++)C=o[A],G=C+g,E[T++]=C,E[T++]=G;return{attributes:c,indices:E}}(m);else{if(A=P(a.CorridorGeometryLibrary.computePositions(m),m.cornerType),A.attributes.position.values=f.PolygonPipeline.scaleToGeodeticHeight(A.attributes.position.values,y,c),l.defined(o._offsetAttribute)){const t=A.attributes.position.values.length,i=new Uint8Array(t/3),r=o._offsetAttribute===e.GeometryOffsetAttribute.NONE?0:1;e.arrayFill(i,r),A.attributes.applyOffset=new d.GeometryAttribute({componentDatatype:n.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:1,values:i})}}const _=A.attributes,E=i.BoundingSphere.fromVertices(_.position.values,void 0,3);return new d.Geometry({attributes:_,indices:A.indices,primitiveType:d.PrimitiveType.LINES,boundingSphere:E,offsetAttribute:o._offsetAttribute})},function(e,t){return l.defined(t)&&(e=v.unpack(e,t)),e._ellipsoid=r.Ellipsoid.clone(e._ellipsoid),v.createGeometry(e)}}));
